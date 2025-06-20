// ... all previous imports stay unchanged
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
  Button,
  Popover,
  MenuItem,
  Chip,
  Link,
} from "@mui/material";
import Typography from "../Typography/Typography";
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
import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMenuInfoDetails } from "./MenuBarAPI";
import { getUserData } from "../../Modules/Login/Encrypt";
import GreenwaveLogo from "../../assets/Images/GreenwaveLogo.png";
import "./MenuBar.css";
import ThemeToggle from "../../../ThemeToggle";
import "./MenuBar.scss";

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
  width: `calc(${theme.spacing(6.9)} + 1px)`,
  
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

export default function MiniDrawer() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [menuInfo, setMenuInfo] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverStack, setPopoverStack] = useState([]);
  const navigate = useNavigate();
  const userDetails = getUserData();
  const userName = userDetails?.userDetails?.userName;

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => {
    setOpen(false);
    setExpandedItems({});
    setPopoverStack([]);
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    getMenuInfoDetails().then((menu) => setMenuInfo(menu));
  }, []);

  const toggleExpand = (key) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderNestedPopover = (level = 0) => {
    return popoverStack.map((entry, index) => (
      <Popover
      elevation={0}
            className="popover"
        key={index}
        open={Boolean(entry.anchorEl)}
        anchorEl={entry.anchorEl}
        onClose={() => setPopoverStack((prev) => prev.slice(0, index))}
        anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
  }}
  transformOrigin={{
    vertical: 'bottom',
    horizontal: 'left',
  }}
      >
        <Box>
          {entry.items.map((item, i) => {
            const key = `${item.label}-${i}`;
            const selected = window.location.pathname === item.path;
            const hasChildren =
              Array.isArray(item.items) && item.items.length > 0;
            const levelClass = `menu-level-${entry.level}`;
            return (
              <ListItem
                key={key}
                disablePadding
                className={`menu-item ${levelClass} ${selected ? "selected" : ""}`}
                onClick={(e) => {
                    if (hasChildren) {
                      console.log("Level::::"+entry.level+1)
                      const newAnchor = {
                        anchorEl: e.currentTarget,
                        items: item.items,
                        level: entry.level + 1,
                      };
                      setPopoverStack((prev) => [
                        ...prev.slice(0, index + 1),
                        newAnchor,
                      ]);
                    } else if (item.path) {
                      navigate(item.path);
                      setPopoverStack([]);
                    }
                  }}
              >
                <ListItemButton
                  
                >
                  <ListItemIcon className="menu-icon" >
                    {item.logo && (
                      <FontAwesomeIcon icon={item.logo.split(" ")} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography className={`menu-text`}>
                        {item.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </Box>
      </Popover>
    ));
  };

  const renderMenuItems = (items, parentKey = "", level = 0) =>
    items.map((item, index) => {
      const fullPath = item.path || "";
      const key = `${parentKey}${item.label}-${index}`;
      const selected = window.location.pathname === fullPath;
      const hasChildren = Array.isArray(item.items) && item.items.length > 0;
      const isExpanded = expandedItems[key];
      const levelClass = `menu-level-${level}`;

      return (
        <React.Fragment key={key}>
          <ListItem
            disablePadding
            className={`menu-item ${levelClass} ${selected ? "selected" : ""}`}
            onClick={(e) => {
                    if (hasChildren && open) toggleExpand(key);
                    else if (!open && hasChildren) {
                      console.log("Level::::"+level+1)
                      setPopoverStack([
                        {
                          anchorEl: e.currentTarget,
                          items: item.items,
                          level: level + 1,
                        },
                      ]);
                    } else navigate(fullPath);
                  }}
                  
          >
              <Link
                href={item.path}
                style={{ textDecoration: "none", color: "inherit" }}
                onClick={(e) => e.preventDefault()}
              >
                <ListItemButton style={{width:'100%'}}
                  
                  
                >
                  <Tooltip title={open ? "" : item.label} placement="right">
            
                  <ListItemIcon className="menu-icon"
                 
                  >
                    {hasChildren ? (
                      isExpanded ? (
                        <KeyboardArrowDownIcon />
                      ) : (
                        <KeyboardArrowRightIcon />
                      )
                    ) : (
                      item.logo && (
                        <FontAwesomeIcon icon={item.logo.split(" ")} className="menu-icon"/>
                      )
                    )}
                  </ListItemIcon>
                  </Tooltip>
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography className="menu-text">
                        {item.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </Link>
          </ListItem>
          {hasChildren && open && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box className="submenu-box">
                {renderMenuItems(item.items, key + "/", level + 1)}
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
    <Box className={`logout-box`}>
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
      <StyledDrawer variant="permanent" open={open}>
        <div className="fixed-drawer">
          <DrawerHeader>
            {!open ? (
              <IconButton onClick={handleDrawerOpen} >
                <MenuIcon  />
              </IconButton>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "row", gap: "10px" }}
              >
                <IconButton onClick={handleDrawerClose}>
                  <MenuIcon  style={{paddingLeft:"4px"}}/>
                </IconButton>
                <Chip
                  label="My Greenwave"
                  size="medium"
                  //style={{ color: "white", backgroundColor: "#3c4a52" }}
                  avatar={
                    <img
                      src={GreenwaveLogo}
                      style={{ width: "1rem", height: "1rem" }}
                    />
                  }
                />
              </div>
            )}
          </DrawerHeader>
          <Divider className="divider" />
        </div>
        <List >{menuInfo?.items ? renderMenuItems(menuInfo.items) : null}</List>

        <div className="fixed-section">
          <Divider className="divider" />
          <ThemeToggle/>
          <ListItemButton
            onClick={handleMenuClick}
            className="menu-item username-avatar"
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
        <Outlet />
      </Box>

      {renderNestedPopover()}
    </Box>
  );
}
