import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import menuItems from "./MenuIcon";
import { FaCar } from "react-icons/fa";

//Page Info Api
import { getUserPageInfo } from "./MenuBarAPI";
import { getUserData } from "../../Modules/Login/Encrypt";
import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

export default function MiniDrawer({ children }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [userPageInfo, setUserPageInfo] = useState([]);
  const navigate = useNavigate();
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  //Call User Page Info API
  const fetchPageInfo = async () => {
    try {
      const { token } = getUserData();
      const response = await getUserPageInfo(token);
    let allotedPages=response.data.allotedPages
      if(response.data.department==='HR')
      {
        allotedPages['Referrals']=['referral','hr-referral']
      }
     console.log("User Page Info:", allotedPages,response);
      if (response.status === 200) {
        setUserPageInfo(response.data.allotedPages);
      } else {
        console.error("Failed to fetch user page info:", response);
      }
    } catch (error) {
      console.error("Error fetching user page info:", error);
    }
  };

  //Call User Page Info API on component mount
  useEffect(() => {
    fetchPageInfo();
  }, []);

  //Handle Menu Click
  const handelMenuClick = (text) => {
    console.log("Menu Clicked:", text);
    navigate(text.toLowerCase());
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 5,
              },
              open && { display: 'none' },
            ]}
          >
            <MenuIcon />
          </IconButton>
          
        </Toolbar>
      </AppBar> */}
      <Drawer
        variant="permanent"
        open={open}
        sx={
          window.location.pathname === "/login" ||
          window.location.pathname === "/"
            ? { display: "none" }
            : {}
        }
      >
        <DrawerHeader>
          <IconButton
            onClick={handleDrawerOpen}
            sx={[
              {
                marginRight: "4px",
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          {open && (
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "rtl" ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          )}
        </DrawerHeader>
        <Divider />
        <List>
          {userPageInfo.map((text, index) => {
            const currentPage =
              window.location.pathname.split("/")[1] === text.toLowerCase();
            return (
              <ListItem key={text} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  onClick={() => handelMenuClick(text)}
                  sx={[
                    {
                      minHeight: 48,
                      px: 2.5,
                      backgroundColor: currentPage ? "#EAEFEF" : "transparent",
                    },
                    open
                      ? {
                          justifyContent: "initial",
                        }
                      : {
                          justifyContent: "center",
                        },
                  ]}
                >
                  <ListItemIcon
                    sx={[
                      {
                        minWidth: 0,
                        justifyContent: "center",
                        color: currentPage ? "#54A8C9" : "",
                      },
                      open
                        ? {
                            mr: 3,
                          }
                        : {
                            mr: "auto",
                          },
                    ]}
                  >
                    {menuItems.map((item, id) => {
                      if (item.label.toLowerCase() === text.toLowerCase()) {
                        // console.log(
                        //   "iconName",
                        //   item.label.toLowerCase(),
                        //   text.toLowerCase()
                        // );
                        return <i key={id} style={{marginLeft:"3px"}} className={item.icon} />
                      } else {
                        <p>NA</p>;
                      }
                    })}
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    sx={[
                      open
                        ? {
                            opacity: 1,
                          }
                        : {
                            opacity: 0,
                          },
                    ]}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider />
      </Drawer>

      <Box sx={{ flexGrow: 1, p: 1 }}>{children}</Box>
    </Box>
  );
}
