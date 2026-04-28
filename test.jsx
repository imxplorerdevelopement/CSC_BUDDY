import React, { useState, useEffect } from "react";
import { BootLoadingScreen } from "./src/ui/LoadingScreen.jsx";
import { HomeLaunchpad } from "./src/workspaces/Home.jsx";

export default function TestApp() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <BootLoadingScreen />;
  }

  return <HomeLaunchpad onOpenSection={(id) => console.log(id)} />;
}
