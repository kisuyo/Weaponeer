import {
  HouseIcon,
  Link,
  ListIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";

export default function Bottombar() {
  const routes = [
    {
      name: "Store",
      path: "/",
      icon: <ShoppingCartIcon />,
    },
    {
      name: "Bag",
      path: "/inventory",
      icon: <ListIcon />,
    },
    {
      name: "Home",
      path: "/home",
      icon: <HouseIcon />,
    },
    {
      name: "PVP",
      path: "/profile",
      icon: <UserIcon />,
    },
    {
      name: "User",
      path: "/profile",
      icon: <UserIcon />,
    },
  ];
  return (
    <div className="flex justify-evenly h-[60px] gap-2 w-full">
      {routes.map((route) => (
        <div
          key={route.name}
          className="flex flex-col gap-1 items-center justify-center"
        >
          <div>{route.icon}</div>
          <span className="text-sm">{route.name}</span>
        </div>
      ))}
    </div>
  );
}
