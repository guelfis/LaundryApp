import { supabase } from "./supabase";

interface WriteSupportTicketProps {
  email: string | null;          
  ticketType: 'bug' | 'support'; 
  bugDescription: string;
  app_version: string;
  userAgent: string;
}

export const writeSupportTicket = async ({
  email, 
  ticketType, 
  bugDescription, 
  app_version, 
  userAgent 
}: WriteSupportTicketProps): Promise<void> => {
  const { error } = await supabase
    .from('support_tickets')
    .insert([
        {
            user_email: email,
            ticket_type: ticketType,
            message: bugDescription,
            app_version: app_version,
            user_agent: userAgent 
        }
    ]);

  if (error) throw error;
};
