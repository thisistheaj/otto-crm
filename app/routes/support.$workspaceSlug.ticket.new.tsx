import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useParams } from "@remix-run/react";
import { supabaseAdmin } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface ActionData {
  errors: {
    _form?: string;
    email?: string;
    subject?: string;
    description?: string;
  };
}

export async function action({ request, params }: { request: Request; params: { workspaceSlug: string } }): Promise<Response | ActionData> {
  

  // Get workspace
  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('slug', params.workspaceSlug)
    .single();

  

  if (workspaceError) {
    console.error('Workspace error:', workspaceError);
    return { 
      errors: { 
        _form: "Failed to find workspace. Please try again." 
      } 
    };
  }

  if (!workspace) {
    throw new Response("Workspace not found", { status: 404 });
  }

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;

  

  // Validate
  const errors: ActionData['errors'] = {};
  if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.email = "Please enter a valid email address";
  }
  if (!subject?.trim()) {
    errors.subject = "Subject is required";
  }
  if (!description?.trim()) {
    errors.description = "Description is required";
  }

  if (Object.keys(errors).length > 0) {
    
    return { errors };
  }

  

  try {
    // Create ticket and chat room
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        workspace_id: workspace.id,
        subject: subject.trim(),
        description: description.trim(),
        email: email.trim(),
        status: 'new',
        priority: 'medium'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return { 
        errors: { 
          _form: "Failed to create ticket. Please try again." 
        } 
      };
    }

    

    // Create chat room
    const { data: chatRoom, error: chatError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        ticket_id: ticket.id,
        status: 'open'
      })
      .select()
      .single();

    if (chatError) {
      console.error('Chat room creation error:', chatError);
      // Cleanup ticket if chat room creation fails
      const { error: deleteError } = await supabaseAdmin
        .from('tickets')
        .delete()
        .eq('id', ticket.id);
      
      if (deleteError) {
        console.error('Failed to cleanup ticket:', deleteError);
      }

      return { 
        errors: { 
          _form: "Failed to create chat room. Please try again." 
        } 
      };
    }

    

    // Update ticket with chat room id
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ chat_room_id: chatRoom.id })
      .eq('id', ticket.id);

    if (updateError) {
      console.error('Failed to update ticket with chat room:', updateError);
      return { 
        errors: { 
          _form: "Failed to link chat room. Please try again." 
        } 
      };
    }

    
    return redirect(`/support/${params.workspaceSlug}/ticket/${ticket.id}/chat`);
  } catch (error) {
    console.error('Unexpected error:', error);
    return { 
      errors: { 
        _form: "An unexpected error occurred. Please try again." 
      } 
    };
  }
}

export default function NewTicket() {
  const params = useParams();
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Card className="max-w-2xl mx-auto">
      <Form method="post">
        <CardHeader>
          <CardTitle>Start a Support Chat</CardTitle>
          <CardDescription>
            Tell us what you need help with and we'll connect you with our support team right away. 
            This will create a support ticket so you can easily reference the conversation later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionData?.errors?._form && (
              <Alert variant="destructive">
                <AlertDescription>{actionData.errors._form}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                aria-describedby="email-error"
                placeholder="Where should we reach you?"
              />
              {actionData?.errors?.email && (
                <p className="text-sm text-destructive" id="email-error">
                  {actionData.errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">What's the topic?</Label>
              <Input
                id="subject"
                name="subject"
                required
                aria-describedby="subject-error"
                placeholder="Brief summary of what you need help with"
              />
              {actionData?.errors?.subject && (
                <p className="text-sm text-destructive" id="subject-error">
                  {actionData.errors.subject}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tell us more</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={5}
                aria-describedby="description-error"
                placeholder="Describe your question or issue in detail, and we'll help you right away"
              />
              {actionData?.errors?.description && (
                <p className="text-sm text-destructive" id="description-error">
                  {actionData.errors.description}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Connecting..." : "Start Chat"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Form>
    </Card>
  );
} 