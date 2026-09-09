"use client";

import * as React from "react";
import { AppProviders } from "./AppProviders";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
