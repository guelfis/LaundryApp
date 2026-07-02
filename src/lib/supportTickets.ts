import { supabase } from "./supabase";

interface WriteSupportTicketProps {
  profile_id: string;
  apartment_id?: string;
  household_id?: string;  
  ticketType: 'bug' | 'support'; 
  bugDescription: string;
  app_version: string;
  userAgent: string;
}

export const writeSupportTicket = async ({
  profile_id,
  apartment_id,
  household_id,
  ticketType, 
  bugDescription, 
  app_version, 
  userAgent 
}: WriteSupportTicketProps): Promise<void> => {
  const { error } = await supabase
    .from('support_tickets')
    .insert([
        {
            profile_id: profile_id,
            apartment_id: apartment_id,
            household_id: household_id,
            ticket_type: ticketType,
            message: bugDescription,
            app_version: app_version,
            user_agent: userAgent 
        }
    ]);

  if (error) throw error;
};
