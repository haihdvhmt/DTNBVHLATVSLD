(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define("@tkv/plugin-h5p/client-v2", ["@nocobase/client-v2","react","antd","@nocobase/flow-engine","react/jsx-runtime","@ant-design/icons"], factory);
  } else if (typeof exports === "object" && typeof module === "object") {
    module.exports = factory(require("@nocobase/client-v2"), require("react"), require("antd"), require("@nocobase/flow-engine"), require("react/jsx-runtime"), require("@ant-design/icons"));
  }
})(self, function(__dep0__, __dep1__, __dep2__, __dep3__, __dep4__, __dep5__) {
  var __module__ = { exports: {} };
  var exports = __module__.exports;
  var module = __module__;
  function require(name) {
    var map = {
    "@nocobase/client-v2": __dep0__,
    "react": __dep1__,
    "antd": __dep2__,
    "@nocobase/flow-engine": __dep3__,
    "react/jsx-runtime": __dep4__,
    "@ant-design/icons": __dep5__
    };
    if (map[name] !== undefined) return map[name];
    throw new Error("Cannot find module: " + name);
  }
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client-v2/index.tsx
var client_v2_exports = {};
__export(client_v2_exports, {
  default: () => plugin_default
});
module.exports = __toCommonJS(client_v2_exports);

// src/client-v2/plugin.tsx
var import_client_v2 = require("@nocobase/client-v2");

// src/client-v2/pages/H5PSettingsPage.tsx
var import_react = require("react");
var import_antd = require("antd");

// src/client-v2/locale.ts
var import_flow_engine = require("@nocobase/flow-engine");

// package.json
var package_default = {
  name: "@tkv/plugin-h5p",
  version: "0.1.0",
  description: "H5P interactive content integration for NocoBase",
  displayName: "H5P Interactive Content",
  "displayName.zh-CN": "N\u1ED9i dung t\u01B0\u01A1ng t\xE1c H5P",
  keywords: ["nocobase", "h5p", "interactive", "elearning"],
  license: "AGPL-3.0",
  main: "./dist/server/index.js",
  scripts: {
    "build:server": "tsup src/server/index.ts --format cjs --out-dir dist/server --dts --external @nocobase/* --external @lumieducation/h5p-server",
    "build:client": "tsup src/client-v2/index.tsx --format esm --out-dir dist/client-v2 --dts --external @nocobase/* --external react --external react-dom --external antd --external @ant-design/icons --external react-router-dom --external i18next --external react-i18next --external @formily/* --external ahooks --external lodash --external dayjs --external axios --external @emotion/css",
    build: "npm run build:server && npm run build:client",
    postbuild: "node scripts/create-entries.js"
  },
  devDependencies: {
    "@nocobase/server": "2.3.0-beta.9",
    "@nocobase/database": "2.3.0-beta.9",
    "@nocobase/client-v2": "2.3.0-beta.9",
    "@nocobase/flow-engine": "2.3.0-beta.9",
    "@types/node": "^20",
    "@types/react": "^18",
    tsup: "^8.0.0",
    typescript: "^5.4.0"
  },
  dependencies: {
    "@lumieducation/h5p-server": "^10.0.4"
  },
  peerDependencies: {
    "@nocobase/server": ">=2.3.0",
    "@nocobase/database": ">=2.3.0",
    "@nocobase/client-v2": ">=2.3.0"
  }
};

// src/client-v2/locale.ts
function useT() {
  const engine = (0, import_flow_engine.useFlowEngine)();
  return (str) => engine.context.t(str, { ns: [package_default.name, "client"] });
}

// src/client-v2/pages/H5PSettingsPage.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var { Title } = import_antd.Typography;
function H5PSettingsPage() {
  const t = useT();
  const [info, setInfo] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    fetch("/api/h5p:info", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("NOCOBASE_TOKEN") || ""}`
      }
    }).then((res) => res.json()).then((data) => {
      setInfo(data?.data);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, []);
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Spin, { size: "large", style: { display: "block", margin: "100px auto" } });
  if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Alert, { type: "error", message: t("Error"), description: error });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_antd.Space, { direction: "vertical", size: "large", style: { width: "100%", padding: 24 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, { level: 4, children: t("H5P Interactive Content") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Card, { title: t("System Info"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_antd.Descriptions, { column: 1, bordered: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Descriptions.Item, { label: t("Plugin Version"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Tag, { color: "blue", children: info?.version || "0.1.0" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Descriptions.Item, { label: t("Total Contents"), children: info?.totalContents ?? 0 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Descriptions.Item, { label: t("Storage Path"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: info?.storagePath || "N/A" }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_antd.Card, { title: t("Setup Guide"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_antd.Alert,
      {
        type: "info",
        showIcon: true,
        message: t("H5P Libraries Required"),
        description: t(
          "To create interactive content, you need to install H5P content type libraries. Upload .h5p library files through the Content Manager tab."
        )
      }
    ) })
  ] });
}

// src/client-v2/pages/H5PContentsPage.tsx
var import_react2 = require("react");
var import_antd2 = require("antd");
var import_icons = require("@ant-design/icons");
var import_jsx_runtime2 = require("react/jsx-runtime");
var { Title: Title2 } = import_antd2.Typography;
function H5PContentsPage() {
  const t = useT();
  const [contents, setContents] = (0, import_react2.useState)([]);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [createModalOpen, setCreateModalOpen] = (0, import_react2.useState)(false);
  const [form] = import_antd2.Form.useForm();
  const token = localStorage.getItem("NOCOBASE_TOKEN") || "";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  const fetchContents = () => {
    setLoading(true);
    fetch("/api/h5pContents:list?appends=createdBy&sort=-createdAt", { headers }).then((res) => res.json()).then((data) => {
      setContents(data?.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  (0, import_react2.useEffect)(() => {
    fetchContents();
  }, []);
  const handleCreate = async () => {
    const values = await form.validateFields();
    await fetch("/api/h5pContents:create", {
      method: "POST",
      headers,
      body: JSON.stringify(values)
    });
    import_antd2.message.success(t("Created successfully"));
    setCreateModalOpen(false);
    form.resetFields();
    fetchContents();
  };
  const handleDelete = async (id) => {
    import_antd2.Modal.confirm({
      title: t("Delete Content"),
      content: t("Are you sure you want to delete this content?"),
      onOk: async () => {
        await fetch(`/api/h5pContents:destroy/${id}`, {
          method: "POST",
          headers
        });
        import_antd2.message.success(t("Deleted successfully"));
        fetchContents();
      }
    });
  };
  const columns = [
    {
      title: t("Title"),
      dataIndex: "title",
      key: "title"
    },
    {
      title: t("Content Type"),
      dataIndex: "contentType",
      key: "contentType",
      render: (v) => v ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Tag, { children: v }) : "-"
    },
    {
      title: t("Library"),
      dataIndex: "library",
      key: "library",
      render: (v) => v ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Tag, { color: "blue", children: v }) : "-"
    },
    {
      title: t("Status"),
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const color = v === "published" ? "green" : v === "draft" ? "orange" : "default";
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Tag, { color, children: t(v || "draft") });
      }
    },
    {
      title: t("Created At"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "-"
    },
    {
      title: t("Actions"),
      key: "actions",
      render: (_, record) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_antd2.Space, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Button, { size: "small", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_icons.EyeOutlined, {}), title: t("Preview"), disabled: true }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Button, { size: "small", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_icons.EditOutlined, {}), title: t("Edit"), disabled: true }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_antd2.Button,
          {
            size: "small",
            icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_icons.DeleteOutlined, {}),
            danger: true,
            onClick: () => handleDelete(record.id)
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_antd2.Space, { direction: "vertical", size: "large", style: { width: "100%", padding: 24 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Title2, { level: 4, style: { margin: 0 }, children: t("H5P Content Manager") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Button, { type: "primary", icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_icons.PlusOutlined, {}), onClick: () => setCreateModalOpen(true), children: t("Add Content") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Card, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_antd2.Table,
      {
        dataSource: contents,
        columns,
        loading,
        rowKey: "id",
        pagination: { pageSize: 20 }
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_antd2.Modal,
      {
        title: t("Add H5P Content"),
        open: createModalOpen,
        onOk: handleCreate,
        onCancel: () => {
          setCreateModalOpen(false);
          form.resetFields();
        },
        okText: t("Create"),
        cancelText: t("Cancel"),
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_antd2.Form, { form, layout: "vertical", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_antd2.Form.Item,
            {
              name: "title",
              label: t("Title"),
              rules: [{ required: true, message: t("Please enter a title") }],
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Input, { placeholder: t("Enter content title") })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Form.Item, { name: "contentType", label: t("Content Type"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_antd2.Input, { placeholder: t("e.g. Quiz, Interactive Video, Course Presentation") }) })
        ] })
      }
    )
  ] });
}

// src/client-v2/plugin.tsx
var PluginH5PClient = class extends import_client_v2.Plugin {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: "h5p",
      title: this.t("H5P Interactive Content"),
      icon: "PlayCircleOutlined"
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: "h5p",
      key: "index",
      title: this.t("H5P Settings"),
      Component: H5PSettingsPage
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: "h5p",
      key: "contents",
      title: this.t("Content Manager"),
      Component: H5PContentsPage
    });
  }
};
var plugin_default = PluginH5PClient;

  return __module__.exports;
});
