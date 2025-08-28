import { title } from "process";

const SITE = {
  TITLE: "Town Of Islip LogBook",
  DESCRIPTION: "LogBook application for the Town Of Islip Marina",
  LOGO: "/toilogo.png",
  TERMS_OF_SERVICE: "/terms",
  PRIVACY_POLICY: "/privacy",
  NAV_LINKS: [
    { title: "Home", href: "/" },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Login", href: "/login" },
    { title: "Logout", href: "/logout" },
    { title: "Profile", href: "/profile" },
    { title: "Books", href: "/Books" },
    { title: "Privacy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" }
  ],
  MARINA: [
    { label: "Atlantique", value: "ATLANTIQUE" },
  { label: "Bay Shore", value: "BAYSHORE" },
  { label: "Brown River East", value: "BROWNRIVEREAST" },
  { label: "Brown River West", value: "BROWNRIVERWEST" },
  { label: "East Islip", value: "EASTISLIP" },
  { label: "Great River", value: "GREATRIVER" },
  { label: "Homan Creek", value: "HOMANCREEK" },
  { label: "Maple Avenue", value: "MAPLEAVENUE" },
  { label: "Maple Street", value: "MAPLESTREET" },
  { label: "Ocean Avenue", value: "OCEANAVENUE" },
  { label: "Portco Call", value: "PORTOCALL" },
  { label: "Raymond Street", value: "RAYMONDSTREET" },
  { label: "West Avenue", value: "WESTAVENUE" },
  { label: "West Islip", value: "WESTISLIP" },
  ]
};
const PROFILE = {
  firstName: "John",
  lastName: "Smith",
  title: "Marina Guard"
};

export { SITE, PROFILE };
