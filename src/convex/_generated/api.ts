/* eslint-disable */
/**
 * This file was automatically generated. DO NOT MODIFY IT BY HAND.
 * Instead, modify the Convex functions and re-run the CLI command to regenerate this file.
 */

import type { ApiFromModules } from "convex/server";

/**
 * A type describing your app's public Convex API.
 *
 * This `api` object lets you:
 * 1. Call public actions and queries from the client.
 * 2. Use the names of queries/mutations/actions safely, without the use of string constants.
 *
 * @example
 * ```ts
 * // In a React component or page
 * import { api } from "../convex/_generated/api";
 * import { useAction, useQuery } from "convex/react";
 *
 * const data = useQuery(api.myModule.myQuery, { arg1: "hello" });
 * const action = useAction(api.myModule.myAction);
 * ```
 */
export const api = {
  leads: {
    // Add leads functions as needed
  },
  tokens: {
    createToken: "tokens:createToken" as const,
    validateToken: "tokens:validateToken" as const,
    activateToken: "tokens:activateToken" as const,
    checkToken: "tokens:checkToken" as const,
    cleanupExpiredTokens: "tokens:cleanupExpiredTokens" as const,
    getTokenStats: "tokens:getTokenStats" as const,
  },
} as const;

export type Api = any; 