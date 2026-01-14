import { History, Github, FileText, Gamepad2, HelpCircle } from "lucide-react";
import { XIcon } from "~/components/icons";
import { EXTERNAL_LINKS } from "~/lib/constants";
import type { NavMenuItem } from "./nav-menu.types";

export const NAV_MENU_CONFIG: NavMenuItem[] = [
  {
    id: "view",
    label: "View",
    type: "dropdown",
    items: [
      {
        id: "transaction-history",
        icon: History,
        label: (props) =>
          `${props.showTransactionHistory ? "Hide" : "Show"} Transaction History`,
        onClick: (props) => props.onToggleTransactionHistory(),
      },
    ],
  },
  {
    id: "faucet",
    label: "Faucet",
    type: "dropdown",
    visible: (props) => props.environment === "testnet",
    animation: {
      initial: { opacity: 0, scale: 0.9, width: 0 },
      animate: { opacity: 1, scale: 1, width: "auto" },
      exit: { opacity: 0, scale: 0.9, width: 0 },
    },
    items: [
      {
        id: "circle-faucet",
        label: "Circle Faucet",
        href: EXTERNAL_LINKS.CIRCLE_FAUCET,
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    type: "dropdown",
    items: [
      {
        id: "github",
        icon: Github,
        label: "GitHub",
        href: EXTERNAL_LINKS.GITHUB_REPO,
      },
      {
        id: "creator",
        icon: XIcon,
        label: "Creator",
        href: EXTERNAL_LINKS.CREATOR_X,
      },
      {
        id: "docs",
        icon: FileText,
        label: "Bridge Kit Documentation",
        href: EXTERNAL_LINKS.BRIDGE_KIT_DOCS,
        separatorBefore: true,
      },
      {
        id: "explainer",
        icon: HelpCircle,
        label: "How CCTP Works",
        onClick: (props) => props.onOpenExplainer(),
      },
    ],
  },
  {
    id: "disclaimer",
    label: "Disclaimer",
    type: "button",
    onClick: (props) => props.onToggleDisclaimer(),
  },
  {
    id: "arcade",
    label: "Arcade",
    type: "dropdown",
    items: [
      {
        id: "pong",
        icon: Gamepad2,
        label: "Pong",
        onClick: (props) => props.onTogglePongGame(),
      },
    ],
  },
];
