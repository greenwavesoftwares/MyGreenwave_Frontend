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
  Link,
  useMediaQuery,
  AppBar,
} from "@mui/material";
import Typography from "../Typography/Typography";
import Chip from "../Chip/Chip";
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

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    backgroundColor: drawerBgColor,
    color: "white",
    transition: theme.transitions.create("transform", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
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

export default function MobileMenuBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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

  // Close popovers when clicking outside
    const drawerRef = React.useRef(null);
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          open &&
          drawerRef.current &&
          !drawerRef.current.contains(event.target)
        ) {
          handleDrawerClose();
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open]);
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
        className="popover popover-menu-style"
        key={index}
        open={Boolean(entry.anchorEl)}
        anchorEl={entry.anchorEl}
        onClose={() => setPopoverStack((prev) => prev.slice(0, index))}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
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
                    console.log("Level::::" + entry.level + 1);
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
                <ListItemButton>
                  <ListItemIcon
                    className="menu-icon nested-menu-bg"
                    sx={{ minWidth: "40px" }}
                  >
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
      const selectedPath =
        window.location.pathname.split("/").reverse()[0] === fullPath;

      return (
        <React.Fragment key={key}>
          <ListItem
            disablePadding
            className={`menu-item ${levelClass} ${selected ? "selected" : ""}`}
            style={{
              backgroundColor: selectedPath
                ? "rgba(64, 151, 255, 0.1)"
                : "inherit",

              borderLeft: selectedPath ? "3px solid #4097FF" : "none",
            }}
            onClick={(e) => {
              if (hasChildren && open) toggleExpand(key);
              else if (!open && hasChildren) {
                console.log("Level::::" + level + 1);
                setPopoverStack([
                  {
                    anchorEl: e.currentTarget,
                    items: item.items,
                    level: level + 1,
                  },
                ]);
              } else {
                navigate(fullPath);
                handleDrawerClose(); // close drawer on navigation
              }
            }}
          >
            <Link
              href={item.path}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={(e) => e.preventDefault()}
            >
              <ListItemButton
                style={{
                  width: "100%",
                }}
              >
                <Tooltip title={open ? "" : item.label} placement="right">
                  <ListItemIcon className="menu-icon">
                    {hasChildren ? (
                      isExpanded ? (
                        <KeyboardArrowDownIcon />
                      ) : (
                        <FontAwesomeIcon
                          icon="fa-solid fa-angles-right"
                          className="menu-icon"
                        />
                      )
                    ) : (
                      item.logo && (
                        <FontAwesomeIcon
                          icon={item.logo.split(" ")}
                          className="menu-icon"
                          style={{ marginLeft: selectedPath ? "-3px" : "" }}
                        />
                      )
                    )}
                  </ListItemIcon>
                </Tooltip>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography className="menu-text">{item.label}</Typography>
                  }
                />
              </ListItemButton>
            </Link>
          </ListItem>
          {hasChildren && open && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box className="submenu-box drawer-list">
                {renderMenuItems(item.items, key + "/", level + 1)}
              </Box>
            </Collapse>
          )}
        </React.Fragment>
      );
    });

  const handleLogout = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key !== "Theme") {
        localStorage.removeItem(key);
      }
    });
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
      <AppBar position="static" className="mobile-menu-bg">
        <Toolbar
          sx={{
            minHeight: 0,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton
            size="small"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerOpen}
          >
            <MenuIcon />
          </IconButton>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar className="avatar-mobile">
              {convertToInitials(userName)}
            </Avatar>
          </div>
        </Toolbar>
      </AppBar>

      
      <StyledDrawer  ref={drawerRef} variant="persistent" anchor="left" open={open}>
        <div className="fixed-drawer">
          <DrawerHeader>
            {!open ? (
              <IconButton onClick={handleDrawerOpen}>
                <MenuIcon className="menu-icon" />
              </IconButton>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <IconButton onClick={handleDrawerClose}>
                  <MenuIcon
                    style={{ paddingLeft: "4px" }}
                    className="menu-icon"
                  />
                </IconButton>
                <Chip
                  label="My Greenwave"
                  size="small"
                  style={{ color: "white", backgroundColor: "#1976D2" }}
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
        <List>{menuInfo?.items ? renderMenuItems(menuInfo.items) : null}</List>

        <div className="fixed-section">
          <Divider className="divider" />

          <div
            style={{
              display: "flex",
              flexDirection: open ? "row" : "column",
            }}
          >
            <ThemeToggle />
            <ListItemButton
              onClick={handleMenuClick}
              className="menu-item username-avatar"
            >
              {!open && (
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
              )}
              {open && (
                <ListItemText
                  className="menu-text"
                  primary={
                    <>
                      <Chip
                        disabled={!open}
                        color="primary"
                        size="small"
                        label={userName}
                      />
                      {isMobile && (
                        <LogoutIcon
                          className="ml-4"
                          onClick={() => {
                            handleLogout();
                            navigate(`/`);
                          }}
                        />
                      )}
                    </>
                  }
                />
              )}
            </ListItemButton>
          </div>
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

      {/* <Box component="main" className="main-content">
        <Outlet />
      </Box> */}

      {/* {renderNestedPopover()} */}
    </Box>
  );
}
