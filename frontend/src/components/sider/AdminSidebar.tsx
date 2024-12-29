import React, { useState, useEffect } from "react";
import {
  UserOutlined,
  TeamOutlined,
  CarOutlined,
  GiftOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FundProjectionScreenOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { AiOutlineHome } from "react-icons/ai";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

const { Sider } = Layout;

const styles = {
  sider: {
    height: "100vh",
    backgroundColor: "#8792e7",
    color: "#fff",
    transition: "all 0.3s ease-in-out",
  },
  logo: {
    textAlign: "center",
    padding: "20px",
    color: "#fff",
    fontSize: "22px",
    transition: "all 0.3s",
  },
  logoCollapsed: {
    fontSize: "16px",
  },
  logoCircle: {
    background: "#fff",
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    margin: "0 auto 10px",
    transition: "all 0.3s",
  },
  logoCircleCollapsed: {
    width: "50px",
    height: "50px",
  },
  menu: {
    backgroundColor: "transparent",
    fontWeight: "bold",
  },
  menuItem: {
    fontSize: "16px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    paddingLeft: "20px",
    fontWeight: "bold",
    transition: "all 0.3s",
    color: "#000",
  },
  menuItemCollapsed: {
    justifyContent: "center",
    paddingLeft: "0",
  },
  menuItemLogout: {
    color: "#ff4d4f",
  },
  iconStyle: {
    fontSize: "24px",
    marginRight: "10px",
  },
  iconStyleCollapsed: {
    marginRight: "0",
  },
};

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("DASHBOARD", "/dashboard", <DashboardOutlined />),
  getItem("EMPLOYEE", "/employees", <UserOutlined />),
  getItem("MEMBER", "/members", <TeamOutlined />),
  getItem("DRIVER", "/drivers", <IdcardOutlined />),
  getItem("VEHICLE", "/vehicles", <CarOutlined />),
  getItem("TRAINING", "/trainer", <FundProjectionScreenOutlined />),
  getItem("PROMOTION", "/promotion", <GiftOutlined />),
  getItem("TRAINER", "/trainer", <UserOutlined />),
  getItem("ROOM", "/rooms", <AiOutlineHome />),
  getItem("Log out", "/login", <LogoutOutlined />),
];

const AdminSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSelectedKeys([location.pathname]);
  }, [location.pathname]);

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      collapsedWidth={90}
      style={styles.sider}
    >
      <div
        style={{
          ...styles.logo,
          ...(collapsed ? styles.logoCollapsed : {}),
        }}
      >
        <div
          style={{
            ...styles.logoCircle,
            ...(collapsed ? styles.logoCircleCollapsed : {}),
          }}
        />
        {!collapsed && <span>username admin</span>}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={selectedKeys}
        style={styles.menu}
        onClick={handleMenuClick}
        items={items.map((item) => ({
          ...item,
          icon: React.cloneElement(item.icon as React.ReactElement, {
            style: {
              ...styles.iconStyle,
              ...(collapsed ? styles.iconStyleCollapsed : {}),
            },
          }),
          style: {
            ...styles.menuItem,
            ...(collapsed ? styles.menuItemCollapsed : {}),
            ...(item.key === "/login" ? styles.menuItemLogout : {}),
          },
        }))}
      />
    </Sider>
  );
};

export default AdminSidebar;
