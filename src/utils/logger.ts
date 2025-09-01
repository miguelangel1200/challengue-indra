const logger = {
  info: (msg: string, obj?: any) => console.log("[INFO]", msg, obj || ""),
  error: (msg: string, err?: any) => console.error("[ERROR]", msg, err || ""),
};

module.exports = { logger };
