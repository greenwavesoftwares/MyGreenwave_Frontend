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
import LogoutIcon from "@mui/icons-material/Logout";
import { styled, useTheme } from "@mui/material/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMenuInfoDetails } from "./MenuBarAPI";
import { getUserData } from "../../Modules/Login/Encrypt";
import GreenwaveLogo from '../../assets/Images/GreenwaveLogo.png'
import "./MenuBar.css";

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
  const handleDrawerClose = () => {
    setOpen(false);
    setExpandedItems({});
  };
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
    setOpen(true);
  };

  const displayNoMenu = () =>
    window.location.pathname === "/login" ||
    window.location.pathname === "/" ||
    !userDetails?.userDetails?.userId.length > 0;

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
          <ListItem disablePadding className="menu-list-item">
            <Tooltip title={open?"":item.label} placement="right">
            <ListItemButton
              onClick={handleItemClick}
              className={`menu-item ${selected ? "selected" : ""}`}
            >
              <ListItemIcon className="menu-icon">
                {hasChildren ? (
                  isExpanded ? (
                    <KeyboardArrowDownIcon />
                  ) : (
                    <KeyboardArrowRightIcon />
                  )
                ) : (
                  item.logo && <FontAwesomeIcon icon={item.logo.split(" ")} />
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} className="menu-text" />
            </ListItemButton>
            </Tooltip>
          </ListItem>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box className="submenu-box">
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

  const renderLogout = () => (
    <Box className={`logout-box ${displayNoMenu() ? "hidden" : ""}`}>
      <MenuItem
        onClick={() => {
          handleLogout();
          navigate(`/`);
        }}
      >
        <ListItemIcon className="menu-icon">
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <Typography className="menu-text">Logout</Typography>
      </MenuItem>
    </Box>
  );

  return (
    <Box className="drawer-root">
      <StyledDrawer
        variant="permanent"
        open={open}
        // className={displayNoMenu() ? "hidden" : ""}
        style={{ display: displayNoMenu() ? "none" : "" }}
      >
        <DrawerHeader>
          {!open ? (
            <IconButton onClick={handleDrawerOpen}>
              <MenuIcon style={{ color: "white" }} />
            </IconButton>
          ) : (
            <div style={{ display: "flex", flexDirection: "row" }}>
              <IconButton onClick={handleDrawerClose}>
                {theme.direction === "rtl" ? (
                  <ChevronRightIcon style={{ color: "white" }} />
                ) : (
                  <ChevronLeftIcon style={{ color: "white" }} />
                )}
              </IconButton>
              <Chip
                label="My Greenwave"
                size="medium"
                style={{ color: "white", backgroundColor: "#3c4a52" }}
                avatar={<img
                src={GreenwaveLogo}
                style={{ width: "1rem", height: "1rem" }}

                />}
              />
            </div>
          )}
        </DrawerHeader>

        <Divider
          sx={{
            borderColor: "#ffffff30",
            margin: "3px 0px !important",
          }}
        />

        <List>{menuInfo?.items ? renderMenuItems(menuInfo.items) : null}</List>

        <div className="fixed-section">
          <Divider
            sx={{
              borderColor: "#ffffff30",
              margin: "3px 0px !important",
            }}
          />
          <ListItemButton
            onClick={handleMenuClick}
            className="menu-item user-profile"
          >
            <ListItemIcon className="menu-icon">
              <Tooltip
                title={
                  <div className="tooltip-content">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon className="tooltip-icon" />
                      <Typography className="tooltip-text">
                        {userName}
                      </Typography>
                    </Box>
                  </div>
                }
                placement="right"
              >
                <Avatar className="avatar">
                  {convertToInitials(userName)}
                </Avatar>
              </Tooltip>
            </ListItemIcon>
            <ListItemText
              className="menu-text"
              primary={
                <Chip
                  disabled={!open}
                  size="medium"
                  label={userName}
                  className="username-chip"
                />
              }
            />
          </ListItemButton>
          <Popover
            open={openMenu}
            anchorEl={anchorEl}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: "center", horizontal: "right" }}
            transformOrigin={{ vertical: "center", horizontal: "left" }}
            elevation={0}
            className="popover"
          >
            {renderLogout()}
          </Popover>
        </div>
      </StyledDrawer>

      <Box component="main" className="main-content">
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
