import { Request, Response, NextFunction } from "express";

const logging = {
  log: (message: string) => console.log(`[LOG] ${message}`)
};

export function loggingHandler(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  //when request starts
  logging.log(
    `Incoming -> METHOD: [${req.method}] | URL: [${req.url}] | IP: [${req.socket.remoteAddress}]`
  );

  //when response ends
  res.on("finish", () => {
    const duration = Date.now() - start;
    logging.log(
      `Completed -> METHOD: [${req.method}] | URL: [${req.url}] | STATUS: [${res.statusCode}] | TIME: ${duration}ms`
    );
  });

  next();
}
