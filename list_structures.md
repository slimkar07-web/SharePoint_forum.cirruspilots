# SharePoint List Structures

Based on the TypeScript models defined in your project, here are the required structures for your SharePoint lists to integrate real data.

## 1. Categories List
**List Name:** `Categories`

| Field Name | Internal Name (Suggested) | Field Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| Title | `Title` | Single line of text | Yes | The name of the category. (Default Title field) |
| Description | `Description` | Multiple lines of text (Plain) | No | A short description of the category. |
| Color Hex | `ColorHex` | Single line of text | Yes | Hex color code for the category (e.g., `#FF5733`). |
| Icon Name | `IconName` | Single line of text | No | Fluent UI Icon name (e.g., `Message`, `Airplane`). |

*Note: The `id` field maps to the default SharePoint `ID` field.*

---

## 2. Topics List
**List Name:** `Topics`

| Field Name | Internal Name (Suggested) | Field Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| Title | `Title` | Single line of text | Yes | The title of the topic. (Default Title field) |
| URL | `URL` | Hyperlink or Picture | Yes | A link to the topic page. |
| Excerpt | `Excerpt` | Multiple lines of text | No | A short preview of the topic content. |
| Category | `Category` | Lookup | Yes | Lookup to the **Categories** list (Lookup field: Title). |
| Replies Count | `RepliesCount` | Number | Yes | The number of replies in this topic. |
| Views Count | `ViewsCount` | Number | Yes | The number of views for this topic. |
| Last Activity | `LastActivity` | Date and Time | Yes | The date and time of the last reply or post. |
| Is Locked | `IsLocked` | Yes/No (Boolean) | No | Whether the topic is locked for new replies. |
| Is Pinned | `IsPinned` | Yes/No (Boolean) | No | Whether the topic is pinned at the top. |
| Tags | `Tags` | Choice (Multi-select) | No | Tags associated with the topic. |
| Posters | `Posters` | Person or Group (Multi) | Yes | The users who have posted in this topic. |

*Note:*
* *The `id` field maps to the default SharePoint `ID` field.*
* *`CategoryColor` can be fetched through a projected field in the Category lookup, or by retrieving the related Category item via code.*
* *`posters` (IPoster[]) maps well to a multi-select Person or Group column.*

---

## 3. Replies List
**List Name:** `Replies`

| Field Name | Internal Name (Suggested) | Field Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| Title | `Title` | Single line of text | No | (Default Title field - can be optional or auto-generated). |
| Topic | `Topic` | Lookup | Yes | Lookup to the **Topics** list (Lookup field: Title). |
| Body | `Body` | Multiple lines of text (Rich) | Yes | The content of the reply. |
| Is Accepted Answer | `IsAcceptedAnswer` | Yes/No (Boolean) | No | Marks the reply as the accepted answer. |
| Author | `Author` | Person or Group | Yes | (Default Created By field can often be used instead of a custom field). |

*Note: The `id` field maps to the default SharePoint `ID` field. The `createdDate` maps to the default SharePoint `Created` field.*
