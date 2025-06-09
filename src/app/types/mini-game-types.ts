// Shared types used by all mini-games
export type Operation = 'Addition' | 'Subtraction' | 'Multiplication' | 'Division';

export interface FindCompositionsConfig {
  minNumCompositions: number;
  maxNumberRange: number;
  operation: Operation;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface VerticalOperationsConfig {
  numOperations: number;
  maxNumberRange: number;
  operationsAllowed: Operation[];
  requiredCorrectAnswersMinimumPercent: number;
}

export interface ChooseAnswerConfig {
  numOptions: number;
  maxNumberRange: number;
  operationsAllowed: Operation[];
}

export interface MultiStepProblemConfig {
  numQuestions: number;
  maxNumberRange: number;
  numSteps: number;
  operationsAllowed: Operation[];
  requiredCorrectAnswersMinimumPercent: number;
}

export interface FindPreviousNextNumberConfig {
  numQuestions: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface TapMatchingPairsConfig {
  numPairs: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface OrderNumbersConfig {
  numQuestions: number;
  maxNumberRange: number;
  maxNumbersInSequence: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface CompareNumbersConfig {
  numQuestions: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface WhatNumberDoYouHearConfig {
  numQuestions: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface DecomposeNumberConfig {
  numQuestions: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface WriteNumberInLettersConfig {
  numQuestions: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface IdentifyPlaceValueConfig {
  numQuestions: number;
  maxNumberRange: number;
  requiredCorrectAnswersMinimumPercent: number;
}

export interface ReadNumberAloudConfig {
  numQuestions: number;
  maxNumberRange: number;
  displayTime: number;
  requiredCorrectAnswersMinimumPercent: number;
}