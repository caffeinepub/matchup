import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Match } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMatches();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useCreateMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sport: string;
      title: string;
      time: string;
      location: string;
      missing: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createMatch(
        data.sport,
        data.title,
        data.time,
        data.location,
        data.missing,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useJoinMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinMatch(id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["matches"] });
      const previous = queryClient.getQueryData<Match[]>(["matches"]);
      queryClient.setQueryData<Match[]>(["matches"], (old) =>
        (old ?? []).map((m) =>
          m.id === id
            ? { ...m, missing: m.missing > 0n ? m.missing - 1n : 0n }
            : m,
        ),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["matches"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useDeleteMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMatch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
