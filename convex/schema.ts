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
    // User information fields
    fullName: v.optional(v.string()), // User's full name
    email: v.optional(v.string()), // User's email address
    language: v.optional(v.string()), // Selected language
    sessionToken: v.optional(v.string()), // The token used for this session
  }),
  
  // Table for managing access tokens
  tokens: defineTable({
    token: v.string(), // The token ID used in URL
    language: v.string(), // Which language was selected
    createdAt: v.number(), // When the token was created
    expiresAt: v.number(), // When the token expires
    isUsed: v.boolean(), // Whether token has been used already
    clientIp: v.optional(v.string()), // Optional client IP for additional tracking
  }),
}); 