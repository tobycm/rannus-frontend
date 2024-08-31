import { Box, LoadingOverlay } from "@mantine/core";
import React, { createContext, useEffect } from "react";
import { useGuildStore } from "../states/guild";
import { useUserStore } from "../states/user";
import { REALTIME_URL } from "../constants";
import { Guild, User } from "../types";

export type AuthContextType = object;

export const AuthContext = createContext<AuthContextType>({});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkUser, loading: userLoading, token, setUser } = useUserStore((state) => state);
  const { fetchedGuild, loading: guildLoading, guilds, setGuild } = useGuildStore((state) => state);
  useEffect(() => {
    checkUser(false).then((res) => {
      if (res.status == 200) {
        // console.log("User is logged in");
      }
    });
  }, [checkUser]);
  useEffect(() => {
    if (!guilds.size && !userLoading)
      fetchedGuild(false).then((res) => {
        if (res.status == 200) {
          //   console.log("Fetched guilds.");
        }
      });
  }, [fetchedGuild, guilds.size, userLoading]);
  useEffect(() => {
    function connect() {
      const ws = new WebSocket(REALTIME_URL);
      let dontReconnect = false;
      ws.onopen = () => {
        console.log("Connected to websocket");
        ws.send(JSON.stringify({ type: "authorization", token }));
      };
      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === "unauthorized") {
          console.log("Unauthorized");
          ws.close();
          dontReconnect = true;
          return;
        }
        if (data.record) {
          switch (data.type) {
            case "guild": {
              const guild = data.record as Guild;
              setGuild(guild);
              break;
            }
            case "user": {
              const user = data.record as User;
              setUser(user);
              break;
            }
            default:
              break;
          }
        }
      };
      ws.onclose = () => {
        console.log("Websocket closed");
        if (!dontReconnect)
          setTimeout(() => {
            connect();
          }, 1000);
      };
    }
    if (token) {
      connect();
    }
  }, [setGuild, setUser, token]);

  if (userLoading || guildLoading) {
    return (
      <Box pos="relative" h="100vh" w="100vw">
        <LoadingOverlay
          visible={userLoading || guildLoading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />
      </Box>
    );
  }

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};
