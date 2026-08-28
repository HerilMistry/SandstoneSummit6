import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Student {
  id: string;
  roll_number: string;
  name: string;
  qr_token: string;
  created_at: string;
}

interface StudentContextType {
  student: Student | null;
  setStudent: (s: Student | null) => void;
  isLoading: boolean;
  clearStudent: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | null>(null);

const STORAGE_KEY = 'ss6_student';

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudentState] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val) setStudentState(JSON.parse(val));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const setStudent = (s: Student | null) => {
    setStudentState(s);
    if (s) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  };

  const clearStudent = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setStudentState(null);
  };

  return (
    <StudentContext.Provider value={{ student, setStudent, isLoading, clearStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used within StudentProvider');
  return ctx;
}
