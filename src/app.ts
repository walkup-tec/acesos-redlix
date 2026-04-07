import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { router } from "./routes";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "5mb" }));
  app.use("/branding-assets", express.static(path.resolve(process.cwd(), "public", "branding")));

  const webDist = path.resolve(process.cwd(), "web", "dist");
  const indexHtml = path.join(webDist, "index.html");
  const hasUi = fs.existsSync(indexHtml);

  if (hasUi) {
    app.use(
      express.static(webDist, {
        fallthrough: true,
        index: false,
      }),
    );
    app.get("/", (_req, res) => {
      res.sendFile(path.resolve(indexHtml));
    });
    app.use((req, res, next) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      if (path.extname(req.path)) {
        next();
        return;
      }
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.resolve(indexHtml), (err) => {
        if (err) {
          next(err);
        }
      });
    });
  }

  app.use("/api", router);

  return app;
}
