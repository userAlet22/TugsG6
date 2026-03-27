import fs from 'fs';

const helper = `import Icon from "../../components/Icon";

const getStatusColor = (statusName, isBadge = false) => {
  const name = (statusName || "").toLowerCase();
  if (["approved", "completed", "done"].includes(name)) {
    return isBadge ? "bg-green-100 text-green-800" : "bg-green-500 text-white";
  }
  if (["urgent", "onhold", "on hold"].includes(name)) {
    return isBadge ? "bg-orange-100 text-orange-800" : "bg-orange-500 text-white";
  }
  if (["disapproved", "rejected", "canceled"].includes(name)) {
    return isBadge ? "bg-red-100 text-red-800" : "bg-red-500 text-white";
  }
  return isBadge ? "bg-yellow-100 text-yellow-800" : "bg-yellow-500 text-white";
};`;

function fixCampus() {
  const path = './src/pages/CampusDirector/CampusDirectorRequests.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // Replace imports
  content = content.replace('import Icon from "../../components/Icon";', helper);

  // Replace badge
  const badgeRegex = /<span className=\{`px-3 py-1 rounded-full text-sm \$\{[\s\S]*?request\.status === "Pending"[\s\S]*?\}`\}>/m;
  content = content.replace(badgeRegex, `<span className={\`px-3 py-1 rounded-full text-sm \${getStatusColor(request.status || "pending", true)}\`}>`);

  // Replace tabs
  const tabRegex = /className=\{`relative px-4 py-2 font-semibold rounded-md \$\{[\s\S]*?status\.name === "Pending" \|\| status\.id === 1[\s\S]*?\}`\}/m;
  content = content.replace(tabRegex, `className={\`relative px-4 py-2 font-semibold rounded-md \${
                    (selectedTab === status.name) ||
                    (selectedTab === "Pending" && (status.id === 1 || status.name?.toLowerCase() === "pending"))
                      ? getStatusColor(status.name, false)
                      : "bg-transparent text-gray-700"
                  }\`}`);

  fs.writeFileSync(path, content);
  console.log('Fixed CampusDirectorRequests.jsx');
}

function fixAdmin() {
  const path = './src/pages/Admin/Requests.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // Replace imports
  content = content.replace('import Icon from "../../components/Icon";', helper);

  // Replace badge
  const badgeRegex = /<span\s*\n*\s*className=\{`px-3 py-1 rounded-full text-sm \$\{[\s\S]*?request\.status === "Pending"[\s\S]*?\}`\}\s*\n*\s*>/m;
  content = content.replace(badgeRegex, `<span className={\`px-3 py-1 rounded-full text-sm \${getStatusColor(request.status || "pending", true)}\`}>`);

  fs.writeFileSync(path, content);
  console.log('Fixed Admin/Requests.jsx');
}

try {
  fixCampus();
  fixAdmin();
} catch (err) {
  console.error(err);
}
