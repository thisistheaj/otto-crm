# Support Ticket Test Data Initiative

## Overview
Create high-quality test data for support tickets, focusing on 'new' status tickets to test our LLM Agent's RAG capabilities.

## Requirements
- [x] 30 'new' status tickets
- [x] Each ticket has 1 customer message, 0 agent responses
- [x] Questions mostly align with existing documentation
- [x] Some questions intentionally unanswerable
- [x] Data matches TSV format

## Current Documentation Sources
- Articles (articles.tsv)
  - Solar Panel Maintenance Guide
  - Understanding Solar Tax Credits
  - Troubleshooting Common Issues
  - Battery Backup Systems

- Documents (markdown files)
  - Installation Guide
  - Maintenance Schedule
  - System Specifications
  - Warranty Terms

## Implementation Plan

### 1. Document Analysis
- [x] Review all documentation sources
- [x] Create list of key topics covered
- [x] Identify gaps in documentation for unanswerable queries
- [x] Map common customer question types to docs

### 2. Question Generation
- [x] Create 25 questions based on documentation
  - [x] Installation questions (5)
  - [x] Maintenance questions (5)
  - [x] Warranty questions (5)
  - [x] Technical specifications (5)
  - [x] Financial/billing questions (5)
- [x] Create 5 unanswerable questions
  - [x] Edge cases
  - [x] Out of scope queries
  - [x] Questions about undocumented features

### 3. Data Preparation
- [x] Format all tickets in TSV schema
- [x] Ensure proper status flags
- [x] Validate message counts
- [x] Check data integrity

### 4. Quality Assurance
- [x] Verify question distribution
- [x] Check documentation coverage
- [x] Validate TSV format
- [x] Test data loading

## Success Criteria
1. [x] 30 new tickets created
2. [x] Each ticket has exactly 1 customer message
3. [x] Questions cover full range of documentation
4. [x] Include realistic unanswerable queries
5. [x] Data matches existing TSV format
6. [x] Questions are realistic and varied

## Notes
- Focus on common customer pain points
- Include both simple and complex queries
- Maintain realistic language and tone
- Ensure questions reflect actual customer behavior

## Summary of Created Test Data
1. Installation Questions (5)
   - Roof assessment
   - Installation timeline
   - Safety requirements
   - Documentation
   - System commissioning

2. Maintenance Questions (5)
   - Cleaning schedule
   - Performance monitoring
   - Winter preparation
   - Annual inspection
   - System analysis

3. Warranty Questions (5)
   - Warranty transfer
   - Performance claims
   - Extended options
   - Component replacement
   - Maintenance requirements

4. Technical Questions (5)
   - Panel efficiency
   - Inverter compatibility
   - Temperature impact
   - Monitoring capabilities
   - Wind resistance

5. Financial Questions (5)
   - Tax credits
   - Production estimates
   - System sizing
   - State rebates
   - Performance guarantees

6. Unanswerable Questions (5)
   - Smart home integration
   - International warranty
   - Custom panel design
   - Mobile app features
   - Cryptocurrency mining
