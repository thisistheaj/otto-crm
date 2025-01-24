# Requirements

## User Stories and Acceptance Criteria

### Authentication & Workspace Management
As a user, I can sign up and create an account
- [x] Email verification required
- [ ] Password strength requirements enforced
- [x] Profile information collected (full name and avatar required)

As a user, I can manage my workspace access
- [x] View list of workspaces I'm a member of
- [x] Create a new workspace (automatically added as admin)
- [x] Join existing workspaces via invite
- [x] Be redirected to workspace's main page after selection/creation/joining
- [x] Complete profile (full name and avatar) before accessing workspace


### Ticket Management
As a customer, I can create a support ticket
- [x] Submit via web form
- [ ] Receive confirmation email
- [x] Get unique tracking number

As an agent, I can view and manage assigned tickets
- [x] See ticket queue
- [x] Update ticket status
- [ ] Add internal notes
- [x] Communicate with customer

### Real-time Chat
As a customer, I can engage in live chat
- [ ] See agent availability
- [?] Receive typing indicators
- [x] View message history

As an agent, I can handle chat sessions
- [x] Switch between conversations
- [ ] Use quick responses

### Knowledge Base

As an admin/agent, I can manage knowledge base content
- [x] Create/edit articles
- [x] Upload documents
- [x] publish articles and documents so that they are available to the customers

As a customer, I can view the knowledge base
- [x] i can see all the articles and documents
- [x] i can look at an article
- [x] i can look at a document

### Team Settings

As an admin, I can manage workspace configuration
- [x] get an invite link to send to new users
- [x] Set user roles (admin/agent)
- [x] Configure workspace preferences
- [x] delete a workspace

### User Settings

As an employee, I can edit my user settings
- [x] edit my profile
- [x] set my availability status
- [x] Switch between workspaces easily

### Naive Ticket Assignment

As an admin, I can configure ticket routing
- [ ] tikets can be assigned to agents
- [ ] agents can assign themselves to tickets
- [ ] admins can manually reassign tickets to agents
- [ ] tickets are automatically assigned to the first available agent

## API 

### API Routes

as an engineer, i can use api routes for integrating with other services (all endpoints require ADMIN_API_KEY)
- [x] get all agents/admins
- [x] create a new ticket
- [x] update a ticket
- [x] add a chat message to a ticket
- [x] update ticket status
- [x] get a ticket
- [x] get all tickets
- [x] get all articles
- [x] get all documents
- [x] add an article
- [x] add a document
- [x] update an article
- [x] delete an article
- [x] delete a document

### Admin routes

as a superuser (*not* the admin user, but a secure service account), I can do admin tasks
- [x] auth with ADMIN_API_KEY
- [x] delete all data
- [x] delete all files/buckets
- [x] seed test data
- [ ] run a vector database indexing job
- [ ] query the vector database

### Analytics

As an admin or agent I can view performance metrics in the dashboard
- [ ] number of open tickets
- [ ] see the number of tickets assigned to me
- [ ] Ticket resolution times

... TBD

As an admin or agent I can view performance metrics in the metrics page
- [ ] Ticket resolution times

... TBD

## AI Features

### Response Assistance

As an agent, I can receive AI-suggested responses
- [ ] Context-aware suggestions
- [ ] Edit before sending

AI Agent responses
- [ ] users have the option to ask an AI while they wait in the queue

### Smart Knowledge Base
- [ ] the knowledge base gets indexed in a vector database
- [ ] customers can ask questions about the knowledge base
- [ ] agents can generate articles based on the knowledge base
- [ ] AI suggests articles to generate based on customer questions?
