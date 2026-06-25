# Google 試算表串接設定

1. 建立一份新的 Google 試算表。
2. 在試算表選擇「擴充功能」→「Apps Script」。
3. 刪除編輯器中的預設內容。
4. 將網站資料夾內 `google-apps-script/Code.gs` 的內容貼入並儲存。
5. 選擇右上角「部署」→「新增部署作業」。
6. 類型選擇「網頁應用程式」。
7. 執行身分選擇「我」。
8. 誰可以存取選擇「任何人」。
9. 完成授權並複製部署產生的 `/exec` 網址。
10. 開啟網站的 `script.js`，將：

```js
const GOOGLE_APPS_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

改成：

```js
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/部署代碼/exec";
```

完成後，網站表單送出的資料會寫入試算表中的「報名資料」工作表。第一次收到資料時，程式會自動建立標題列；每筆資料會產生唯一的「報名編號」，並回傳至網站成功摘要。

網站正式上線時請使用 HTTPS，並將試算表共用權限限制在實際承辦人員。日後若修改 `Code.gs`，需在 Apps Script 的「管理部署作業」中建立新版本，網站才會套用更新。這次新增報名編號後，也必須重新部署一次。
