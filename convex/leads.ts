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
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", {
      name: args.name,
      budget: args.budget,
      authority: args.authority,
      needs: args.needs,
      timeframe: args.timeframe,
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