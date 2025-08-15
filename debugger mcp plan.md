# Debugger MCP Plan

## Goal

To create an AI-powered assistant (MCP) that helps users systematically debug issues by generating hypotheses, guiding investigation, and adapting based on findings.

## Core Workflow

1.  **Bug Initialization**: For each bug, a dedicated file/session is created.
2.  **Evidence Submission**: The user provides initial evidence (e.g., error messages, logs, screenshots, description of behavior) into the dedicated file/session.
3.  **Hypothesis Generation**: The AI analyzes the evidence and generates a ranked list of potential hypotheses for the bug's cause.
4.  **Guided Investigation**: The AI selects the top hypothesis and provides the user with specific instructions or commands (e.g., check a config file, run a command, inspect a variable) to gather information and test the hypothesis.
5.  **Feedback Loop**: The user performs the steps and reports back the results/observations.
6.  **Hypothesis Evaluation**: Based on the feedback:
    *   If the hypothesis is confirmed, the debugging process might conclude or move to finding a solution.
    *   If the hypothesis is disproven, the AI marks it as incorrect (e.g., crosses it off the list).
7.  **Refinement**: The AI incorporates the new information, re-evaluates, and potentially re-ranks the remaining hypotheses. It then proceeds to guide the investigation of the next most likely hypothesis (Step 4).
8.  **Iteration**: Steps 4-7 repeat until the bug is resolved or hypotheses are exhausted.

## MCP Specification Integration Ideas (@mcp)

How the Model Context Protocol (MCP) specification can support this workflow:

*   **Structured Data Exchange**: Define MCP message schemas for:
    *   Submitting evidence (potentially with types like `log`, `screenshot_path`, `description`).
    *   Representing the list of hypotheses (including ID, description, status: `pending`, `testing`, `confirmed`, `disproven`, rank/likelihood).
    *   Requesting/providing investigation steps (potentially including commands to run, files to check, questions to answer).
    *   Reporting investigation results.
*   **Tool Definitions**: Define MCP tools for the AI to request actions or information:
    *   `requestEvidence(prompt: string)`: Ask the user for specific additional information.
    *   `proposeCommand(command: string, explanation: string)`: Suggest a terminal command for the user to run.
    *   `requestFileContent(filePath: string, relevantSections: string)`: Ask the user to retrieve and provide content from a specific file.
*   **State Management (Implicit)**: While MCP services are ideally stateless, the *conversation context* managed by the MCP client/framework can maintain the state of the debugging session (current evidence, list of hypotheses and their status). Each turn, the relevant state can be passed to the AI via the MCP context, and the AI's response (updated hypotheses, next steps) updates the state for the next turn.
*   **Clear Turn Structure**: MCP's request/response model naturally fits the iterative nature of hypothesis testing.
*   **Agent Capabilities**: The MCP could declare capabilities related to debugging, hypothesis generation, and specific technologies (e.g., `can_debug:python`, `can_debug:kubernetes`).

## Goals

- [ ] Goal 1
- [ ] Goal 2

## Tasks

- [ ] Task 1
- [ ] Task 2 