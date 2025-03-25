// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ai-demo",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },

  async run() {
    const domainName = "ai-demo.cloudcompanion.io";
    const zone = await aws.route53.getZone({
      name: domainName,
      privateZone: false,
    });

    const nextApp = new sst.aws.Nextjs("ai-demo", {
      domain: {
        name: domainName,
        cert: process.env.CERTIFICATE_ARN,
        aliases: [`www.${domainName}`],
        dns: sst.aws.dns({
          zone: zone.zoneId,
          override: true,
        }),
      },
      environment: {
        NODE_ENV: "production",
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT || "",
        NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || "",
      },
      warm: 20,
    });
    return {
      appURL: nextApp.url,
    };
  },
});
