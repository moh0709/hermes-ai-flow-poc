# Framework Overview

This repository demonstrates a reusable AI teamwork framework built around GitHub Issues and a Hermes execution worker.

## Core idea

- **ChatGPT PM** creates and manages work in GitHub Issues.
- **Hermes** polls for runnable tasks on a VPS.
- **GitHub** remains the coordination layer and audit log.
- **Artifacts** live in the repository so each task leaves a durable trace.

## High-level flow

1. A task issue is created with a task ID like `TASK-006`.
2. The issue is labeled `pm:ready` and `hermes:ready`.
3. Hermes claims the issue and updates `.hermes/state.json`.
4. Hermes executes the task and runs validation commands.
5. Hermes writes a terminal log and result report.
6. Hermes comments back on the issue and records the commit reference.
7. Hermes returns to the queue for the next runnable task.

## What belongs in the framework

- worker scripts that understand the queue,
- predictable state handling,
- human-readable reports,
- documented roles,
- issue templates and prompts,
- a setup guide for cloning the pattern into another repository.

## What does not belong

This framework is not a second project-management product. It is a thin, practical operating layer for a specific delivery loop.

## Success criteria

A new project should be able to copy the structure, adjust the labels and templates, and run the worker with minimal friction.
