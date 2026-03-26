import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Match, Message, UserProfile } from "../backend.d";
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

export function useGetMyProfile(isLoggedIn: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMyProfile() as Promise<UserProfile | null>;
    },
    enabled: !!actor && !isFetching && isLoggedIn,
  });
}

export function useUpdateMyProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      bio: string;
      avatarUrl: string;
      skills: Array<string>;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateMyProfile(
        data.name,
        data.bio,
        data.avatarUrl,
        data.skills,
      ) as Promise<void>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useGetAllProfiles(isLoggedIn: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllProfiles();
    },
    enabled: !!actor && !isFetching && isLoggedIn,
  });
}

export function useMatchWithUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      target: import("../backend.d").ProfileEntry["owner"],
    ) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).matchWithUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMatches"] });
    },
  });
}

export function useGetMyMatches(isLoggedIn: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myMatches"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMyMatches();
    },
    enabled: !!actor && !isFetching && isLoggedIn,
  });
}

export function useGetMessages(
  withUser: import("../backend.d").ProfileEntry["owner"] | null,
  enabled: boolean,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", withUser?.toString()],
    queryFn: async () => {
      if (!actor || !withUser) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMessages(withUser) as Promise<Message[]>;
    },
    enabled: !!actor && !isFetching && enabled && !!withUser,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      to: import("../backend.d").ProfileEntry["owner"];
      text: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).sendMessage(data.to, data.text) as Promise<string>;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.to.toString()],
      });
    },
  });
}
