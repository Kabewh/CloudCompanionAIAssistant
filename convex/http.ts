import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * HTTP action that handles the webhook POST request.
 * It accepts fields directly at the top level of the JSON payload.
 */
export const webhookHandler = httpAction(async (ctx, request) => {
  // Make sure this is a POST request
  if (request.method !== "POST") {
    return new Response("Method not allowed. Please use POST.", {
      status: 405,
    });
  }

  // Parse the request body as JSON
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return new Response("Invalid JSON in request body", {
      status: 400,
    });
  }

  // Log the received body
  console.log("Webhook received request:", body);
  
  try {
    // Extract fields with defaults
    const name = body.name || "Unknown lead";
    const budget = body.budget || "Not specified";
    const authority = body.authority || "Not specified";
    const needs = body.needs || "Not specified";
    const timeframe = body.timeframe || "Not specified";
    
    // If we have a token, we can retrieve user data associated with it
    const token = body.token;
    
    // Extract any user data from the request if available
    const fullName = body.fullName || undefined;
    const email = body.email || undefined;
    const language = body.language || undefined;
    
    // Store the lead in the database with user data if available
    const result = await ctx.runMutation(api.leads.createLead, {
      name,
      budget,
      authority,
      needs,
      timeframe,
      // Include optional user data
      fullName,
      email,
      language,
      sessionToken: token
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Lead stored successfully", 
      leadId: result.leadId 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to store lead:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to store lead" 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});

/**
 * HTTP router for the application.
 * This maps HTTP endpoints to their handlers.
 */
const http = httpRouter();

// Define the webhook route
http.route({
  path: "/webhook",
  method: "POST",
  handler: webhookHandler,
});

export default http; 