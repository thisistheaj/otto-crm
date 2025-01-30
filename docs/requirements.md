# Requirements

## User Stories and Acceptance Criteria

### Authentication & Workspace Management
As a user, I can sign up and create an account
- [x] Email verification required
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
- [x] Get unique tracking number

As an agent, I can view and manage assigned tickets
- [x] See ticket queue
- [x] Update ticket status
- [x] Communicate with customer

### Real-time Chat
As a customer, I can engage in live chat
- [?] Receive typing indicators
- [x] View message history

As an agent, I can handle chat sessions
- [x] Switch between conversations
- [x] Use quick responses

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
- [x] run a vector database indexing job
- [x] query the vector database

### Analytics

As an admin or agent I can view performance metrics in the dashboard
- [x] number of open tickets

## AI Features

### Response Assistance

High level todos:

* Design
- [x] examine agentic features
    * RAG => should be able to get info from relevant docs with citations
    * tool use => should be able to use our API to update ticket status & priority 
- [x] choose a vector db (supabase / chroma)
    * supabase is easier to setup
- [x] decide on langchain or not?
    * we should try langchain for this project and see if it is unecassary in the future

* AI Setup (Monday / Tuesday ?)
- [x] connect to a  vector db
- [x] get data into vector db
- [x] connect langhain
- [x] connect langsmith

* UI enhancements: 
- [x] new chats move to open when responding
- [x] pending chats allow user to resolve
- [x] better chat messsages (richtext or separate links?)
- [ ] can create ticket from textbox in KB

* Implement AI Features
- [x] implement: chat suggestions
- [ ] agentic decision making / tool use
    - [ ] agent can set ticket to pending 
    - [ ] agent decides between: (ask a question | update ticket status)

* Test &Measure
- [ ] generate relvant test data to the tasks 
- [ ] determine metrics
- [ ] test in langsmith
- [ ] record video with narrative 

As an agent, I can receive AI-suggested responses
- [x] Context-aware suggestions
- [x] Edit before sending

### Smart Knowledge Base
- [x] the knowledge base gets indexed in a vector database
- [x] customers can ask questions about the knowledge base

### Enhancements

- [x] more statuses in mock ticket data
- [x] realistic convos in mock ticket data
- [x] fix article viewer
- [x] mock documents
- [x] theming 
- [x] colors in tickets page

- [x] filters in tikcets page
- [x] sticky logout
- [x] user profile in nav (w/ status toggle)
- [x] show everyone in "team"
- [x] hide workspace name and invite from agents


