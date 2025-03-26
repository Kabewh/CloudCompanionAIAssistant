import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Insert a new lead into the leads table
 */
export const createLead = mutation({
  args: {
    name: v.string(),
    budget: v.string(),
    authority: v.string(),
    needs: v.string(),
    timeframe: v.string(),
    // Add optional user data fields
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    language: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", {
      name: args.name,
      budget: args.budget,
      authority: args.authority,
      needs: args.needs,
      timeframe: args.timeframe,
      createdAt: Date.now(),
      // Add user data fields if provided
      ...(args.fullName && { fullName: args.fullName }),
      ...(args.email && { email: args.email }),
      ...(args.language && { language: args.language }),
      ...(args.sessionToken && { sessionToken: args.sessionToken }),
    });
    
    return { leadId };
  },
});

/**
 * Create a lead with user data from the language selection flow
 */
export const createLeadWithUserData = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    language: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a new lead with user data
    const leadId = await ctx.db.insert("leads", {
      // Basic lead info with placeholders
      name: args.fullName,
      budget: "Unknown",
      authority: "Unknown",
      needs: "Unknown",
      timeframe: "Unknown",
      // User data
      fullName: args.fullName,
      email: args.email,
      language: args.language,
      sessionToken: args.token,
      createdAt: Date.now(),
    });
    
    return { leadId };
  },
});

/**
 * Get all leads from the database
 */
export const getLeads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("leads")
      .collect();
  },
}); 