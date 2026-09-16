import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitContactMessage } from "../api/customer-contact.api";
import type { CreateContactInput } from "../validations/contact.schema";
import { adminContactKeys } from "@/lib/api/query-keys";

export function useSubmitContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactInput) => submitContactMessage(data),
    onSuccess: () => {
      // Invalidate admin contact queries so newly submitted messages appear in admin list immediately
      queryClient.invalidateQueries({ queryKey: adminContactKeys.all });
    },
  });
}
