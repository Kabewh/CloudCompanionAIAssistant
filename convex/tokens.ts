import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Token expiration time in milliseconds (5 minutes)
const TOKEN_EXPIRATION_MS = 5 * 60 * 1000;

// Generate a random token ID
function generateTokenId() {
  // Generate a random string that's URL-friendly
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Create a new token for the specified language
export const createToken = mutation({
  args: {
    language: v.string(),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = generateTokenId();
    const now = Date.now();
    
    // Create and store a new token
    // The token will not have an expiration time until it's activated
    const tokenId = await ctx.db.insert("tokens", {
      token,
      language: args.language,
      createdAt: now,
      expiresAt: 0, // Initially set to 0, will be set on activation
      isUsed: false,
      clientIp: args.clientIp,
    });
    
    return { token, tokenId };
  },
});

// Activate a token and set its expiration time
export const activateToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the token
    const tokenRecord = await ctx.db
      .query("tokens")
      .filter(q => q.eq(q.field("token"), args.token))
      .first();
    
    if (!tokenRecord) {
      throw new ConvexError("Invalid token");
    }
    
    const now = Date.now();
    
    // Check if token has already been used
    if (tokenRecord.isUsed) {
      throw new ConvexError("Token has already been used");
    }
    
    // If the token has not been activated yet (expiresAt is 0)
    if (tokenRecord.expiresAt === 0) {
      // Set the expiration time from now
      await ctx.db.patch(tokenRecord._id, { 
        expiresAt: now + TOKEN_EXPIRATION_MS 
      });
    }
    
    return { 
      valid: true, 
      language: tokenRecord.language,
      expiresIn: Math.floor((tokenRecord.expiresAt - now) / 1000) // seconds until expiration
    };
  },
});

// Validate a token without marking it as used (for checking)
export const checkToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Special case: empty token means no token provided
    if (!args.token) {
      return { valid: false, reason: "No token provided" };
    }
    
    // Find the token
    const tokenRecord = await ctx.db
      .query("tokens")
      .filter(q => q.eq(q.field("token"), args.token))
      .first();
    
    if (!tokenRecord) {
      return { valid: false, reason: "Invalid token" };
    }
    
    const now = Date.now();
    
    // If token hasn't been activated yet, it's valid but not counting down
    if (tokenRecord.expiresAt === 0) {
      return {
        valid: true,
        language: tokenRecord.language,
        notActivated: true,
        expiresIn: TOKEN_EXPIRATION_MS / 1000 // Full time in seconds
      };
    }
    
    // Check if token is expired
    if (now > tokenRecord.expiresAt) {
      return { valid: false, reason: "Token has expired" };
    }
    
    // Check if token has already been used
    if (tokenRecord.isUsed) {
      return { valid: false, reason: "Token has already been used" };
    }
    
    return { 
      valid: true, 
      language: tokenRecord.language,
      expiresIn: Math.floor((tokenRecord.expiresAt - now) / 1000) // seconds until expiration
    };
  },
});

// Validate a token and mark it as used if valid (kept for backward compatibility)
export const validateToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the token
    const tokenRecord = await ctx.db
      .query("tokens")
      .filter(q => q.eq(q.field("token"), args.token))
      .first();
    
    if (!tokenRecord) {
      throw new ConvexError("Invalid token");
    }
    
    const now = Date.now();
    
    // Activate the token if it hasn't been activated yet
    if (tokenRecord.expiresAt === 0) {
      await ctx.db.patch(tokenRecord._id, { 
        expiresAt: now + TOKEN_EXPIRATION_MS 
      });
    } else if (now > tokenRecord.expiresAt) {
      // Check if token is expired
      throw new ConvexError("Token has expired");
    }
    
    // Check if token has already been used
    if (tokenRecord.isUsed) {
      throw new ConvexError("Token has already been used");
    }
    
    // Mark the token as used
    await ctx.db.patch(tokenRecord._id, { isUsed: true });
    
    return { 
      valid: true, 
      language: tokenRecord.language 
    };
  },
});

// Get token statistics for admin dashboard
export const getTokenStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all tokens
    const tokens = await ctx.db.query("tokens").collect();
    
    // Count active, expired, and used tokens
    const activeTokens = tokens.filter(token => !token.isUsed && token.expiresAt > now);
    const expiredTokens = tokens.filter(token => token.expiresAt <= now);
    const usedTokens = tokens.filter(token => token.isUsed);
    
    // Count tokens by language
    const tokensByLanguage: Record<string, number> = {};
    tokens.forEach(token => {
      tokensByLanguage[token.language] = (tokensByLanguage[token.language] || 0) + 1;
    });
    
    // Recent tokens (last 24 hours)
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const recentTokens = tokens.filter(token => token.createdAt >= last24Hours);
    
    return {
      total: tokens.length,
      active: activeTokens.length,
      expired: expiredTokens.length,
      used: usedTokens.length,
      byLanguage: tokensByLanguage,
      recent: recentTokens.length,
    };
  },
});

// Cleanup expired tokens (could be run periodically)
export const cleanupExpiredTokens = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all expired tokens
    const expiredTokens = await ctx.db
      .query("tokens")
      .filter(q => q.lt(q.field("expiresAt"), now))
      .collect();
    
    // Delete each expired token
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
    }
    
    return { 
      deletedCount: expiredTokens.length 
    };
  },
}); 