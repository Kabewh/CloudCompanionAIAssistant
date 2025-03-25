import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    budget: v.string(),
    authority: v.string(),
    needs: v.string(),
    timeframe: v.string(),
    createdAt: v.number(),
    // Add any additional fields you want to store
  }),
}); 