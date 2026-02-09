import type { SignOptions } from "jsonwebtoken";

export const AUTH_CONFIG: {
  ACCESS_TOKEN_EXPIRES_IN: SignOptions["expiresIn"];
  REFRESH_TOKEN_EXPIRES_IN: SignOptions["expiresIn"];
} = {
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
};
