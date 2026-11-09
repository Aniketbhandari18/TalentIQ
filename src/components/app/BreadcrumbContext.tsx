"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type BreadcrumbContextType = {
  candidateName: string;
  jobTitle: string;
  setCandidateName: (name: string) => void;
  setJobTitle: (title: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  return (
    <BreadcrumbContext.Provider
      value={{
        candidateName,
        jobTitle,
        setCandidateName,
        setJobTitle,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);

  if (!context) {
    throw new Error(
      "useBreadcrumbContext must be used inside BreadcrumbProvider",
    );
  }

  return context;
}
