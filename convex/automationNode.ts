"use node";

import crypto from "node:crypto";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const sendRequestNotification = internalAction({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(
      internal.automation.beginOutboundEvent,
      { eventId: args.eventId },
    );

    if (!claimed) return;

    const context = await ctx.runQuery(
      internal.automation.getNotificationContext,
      { eventId: args.eventId },
    );

    if (!context || !context.recipientEmail) {
      await ctx.runMutation(
        internal.automation.markOutboundSkipped,
        {
          eventId: args.eventId,
          leaseToken: claimed.leaseToken,
          reason: "No recipient email is available.",
        },
      );
      return;
    }

    const url = process.env.N8N_REQUEST_WEBHOOK_URL;
    const secret = process.env.CONVEX_TO_N8N_SECRET;

    if (!url || !secret) {
      await ctx.runMutation(
        internal.automation.markOutboundSkipped,
        {
          eventId: args.eventId,
          leaseToken: claimed.leaseToken,
          reason: "n8n webhook URL or signing secret is not configured.",
        },
      );
      return;
    }

    const payload = {
      eventId: context.eventId,
      eventType: context.eventType,
      borrowRequestId: context.borrowRequestId,
      toolName: context.toolName,
      status: context.status,
      startDate: context.startDate,
      returnBy: context.returnBy,
      recipient: {
        name: context.recipientName,
        email: context.recipientEmail,
      },
      actorName: context.actorName,
    };

    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-lendloop-timestamp": timestamp,
          "x-lendloop-signature": `v1=${signature}`,
          "x-lendloop-event-id": context.eventId,
          "x-lendloop-event-type": context.eventType,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}.`);
      }

      await ctx.runMutation(
        internal.automation.markOutboundSent,
        {
          eventId: args.eventId,
          leaseToken: claimed.leaseToken,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown delivery error.";

      const result = await ctx.runMutation(
        internal.automation.markOutboundFailed,
        {
          eventId: args.eventId,
          leaseToken: claimed.leaseToken,
          error: message,
        },
      );

      if (result.attempts < 5) {
        await ctx.scheduler.runAfter(
          Math.min(60_000, 2 ** result.attempts * 1_000),
          internal.automationNode.sendRequestNotification,
          { eventId: args.eventId },
        );
      }
    }
  },
});
