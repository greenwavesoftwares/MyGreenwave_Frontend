import * as React from "react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse,
  Tooltip,
  Avatar,
  Typography,
  Button,
  Popover,
  MenuItem,
  Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/VpnKey";
import { styled, useTheme } from "@mui/material/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMenuInfoDetails } from "./MenuBarAPI";
import LogoutIcon from "@mui/icons-material/Logout"; // Logout icon
import { getUserData } from "../../Modules/Login/Encrypt";

library.add(fas);

const drawerWidth = 240;
const drawerBgColor = "#263238";

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

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": {
      ...openedMixin(theme),
      backgroundColor: drawerBgColor,
      color: "white",
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": {
      ...closedMixin(theme),
      backgroundColor: drawerBgColor,
      color: "white",
    },
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

function convertToInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts.map((p) => p[0].toUpperCase()).join("");
}

export default function MiniDrawer({ children }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [menuInfo, setMenuInfo] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const userDetails = getUserData();
  const userName = userDetails?.userDetails?.userName;

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const openMenu = Boolean(anchorEl);

  const fetchMenuDetails = async () => {
    const menu = await getMenuInfoDetails();
    setMenuInfo(menu);
  };

  useEffect(() => {
    fetchMenuDetails();
  }, []);

  const toggleExpand = (key) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const displayNoMenu = () => {
    return (
      window.location.pathname === "/login" ||
      window.location.pathname === "/" ||
      !userDetails?.userDetails?.userId.length > 0
    );
  };

  const renderMenuItems = (items, parentKey = "") =>
    items.map((item, index) => {
      const fullPath = item.path || "";
      const key = `${parentKey}${item.label}-${index}`;
      const selected = window.location.pathname === fullPath;
      const hasChildren = Array.isArray(item.items) && item.items.length > 0;
      const isExpanded = expandedItems[key];

      const handleItemClick = () => {
        if (hasChildren) {
          toggleExpand(key);
        } else if (fullPath) {
          navigate(fullPath);
        }
      };

      return (
        <React.Fragment key={key}>
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              onClick={handleItemClick}
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
                backgroundColor: selected ? "#37474F" : drawerBgColor,
                color: "white",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                  color: selected ? "#4FC3F7" : "white",
                }}
              >
                {hasChildren &&
                  (isExpanded ? (
                    <KeyboardArrowDownIcon sx={{ color: "white" }} />
                  ) : (
                    <KeyboardArrowRightIcon sx={{ color: "white" }} />
                  ))}
                {!hasChildren && item.logo && (
                  <FontAwesomeIcon icon={item.logo.split(" ")} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ pl: open ? 4 : 0 }}>
                {renderMenuItems(item.items, key + "/")}
              </Box>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  const handleLogout = () => {
    localStorage.clear();
  };
  const renderLogout = () => {
    return (
      <Box
        sx={{
          background: "#263238",
          display:displayNoMenu()?'none':''
        }}
      >
        <MenuItem
          onClick={() => {
            handleLogout();
            // navigate(`/?tenant=${tenant}`);
            navigate(`/`);
          }}
        >
          <ListItemIcon>
            <LogoutIcon sx={{ color: "white" }} fontSize="small" />
          </ListItemIcon>
          <Typography sx={{ color: "white" }}>Logout</Typography>
        </MenuItem>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex" }}>
      <StyledDrawer
        variant="permanent"
        open={open}
        sx={{
          display:
            displayNoMenu() ? "none"
              : "flex",
        }}
      >
        <DrawerHeader>
          {!open ? (
            <IconButton onClick={handleDrawerOpen}>
              <MenuIcon sx={{ color: "white" }} />
            </IconButton>
          ) : (
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "rtl" ? (
                <ChevronRightIcon sx={{ color: "white" }} />
              ) : (
                <ChevronLeftIcon sx={{ color: "white" }} />
              )}
            </IconButton>
          )}
        </DrawerHeader>

        <Divider sx={{ borderColor: "#455A64" }} />

        <List>{menuInfo?.items ? renderMenuItems(menuInfo.items) : null}</List>

        {/* Fixed bottom section */}
        <div
          className="fixedSection"
          style={{
            position: "sticky",
            bottom: "0",
            left: "0",
            background: drawerBgColor,
            zIndex: "+1",
          }}
        >
          <Divider sx={{ borderColor: "#455A64" }} />

          <ListItemButton
            sx={{ justifyContent: open ? "initial" : "center", color: "white" }}
            onClick={handleMenuClick}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : "auto",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
              }}
            >
              <Tooltip
                title={
                  <div style={{ display: "grid", gap: "8px" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon sx={{ fontSize: "1.2rem" }} />
                      <Typography sx={{ fontSize: "0.9rem" }}>
                        {userName}
                      </Typography>
                    </Box>
                  </div>
                }
                placement="right"
              >
                <Avatar
                  sx={{
                    width: 35,
                    height: 35,
                    fontSize: "0.9rem",
                    background: "#4097FF",
                    color: "white",
                  }}
                >
                  {convertToInitials(userName)}
                </Avatar>
              </Tooltip>
            </ListItemIcon>

            <ListItemText
              sx={{ opacity: open ? 1 : 0 }}
              primary={
                <Chip
                  disabled={!open}
                  size="small"
                  variant="outlined"
                  sx={{
                    border: "1px solid white",
                    color: "white",
                    borderRadius: "1rem",
                    fontSize: "0.75rem",
                  }}
                  label={userName}
                />
              }
            />
          </ListItemButton>

          <Popover
            open={openMenu}
            anchorEl={anchorEl}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: "center",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "center",
              horizontal: "left",
            }}
            elevation={0}
            sx={{ mt: "1rem" }}
          >
            {renderLogout()}
          </Popover>
        </div>
      </StyledDrawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
