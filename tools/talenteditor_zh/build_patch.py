from pathlib import Path

src = Path("TalentEditor/src/talent_editor.go")
s = src.read_text(encoding="utf-8")


def replace_once(old: str, new: str):
    global s
    if old not in s:
        raise RuntimeError(f"Patch anchor not found:\n{old}")
    s = s.replace(old, new, 1)


# UI-only localization support. Core DB/DBC logic and SQL are intentionally untouched.
replace_once(
    '    "math"\n    "sort"',
    '    "math"\n    "os"\n    "os/exec"\n    "sort"',
)

localization = r'''
var currentLanguage = "zh-CN"

func loadLanguage() string {
    data, err := os.ReadFile("language.txt")
    if err != nil {
        return "zh-CN"
    }
    lang := strings.TrimSpace(string(data))
    if lang == "en" || lang == "zh-CN" {
        return lang
    }
    return "zh-CN"
}

func saveLanguage(lang string) error {
    return os.WriteFile("language.txt", []byte(lang), 0644)
}

func tr(text string) string {
    if currentLanguage != "zh-CN" {
        return text
    }

    translations := map[string]string{
        "WoW 3.3.5 Talent Editor - MySQL": "WoW 3.3.5 天赋编辑器 - MySQL",
        "Language": "语言",
        "Info": "提示",
        "Template config.json created at %s. Please edit it and restart.": "已在 %s 创建 config.json 模板。请编辑数据库配置后重新启动。",
        "Select a TalentTab from the left": "请从左侧选择一个天赋页",
        "Select a talent cell to edit": "请选择一个天赋格进行编辑",
        "Talent Tabs": "天赋页",
        "Editor Pane": "编辑面板",
        "Talent Grid": "天赋树",
        "Talent ID": "天赋 ID",
        "Spec ID": "专精 ID",
        "Tier ID": "层级 ID",
        "Column Index": "列索引",
        "Flags": "标志",
        "Required Spell ID": "需求法术 ID",
        "Allow for Pet Flags 1": "宠物允许标志 1",
        "Allow for Pet Flags 2": "宠物允许标志 2",
        "Save": "保存",
        "Cancel": "取消",
        "Delete": "删除",
        "Confirm Delete": "确认删除",
        "Are you sure you want to delete this talent?": "确定要删除这个天赋吗？",
        "Empty talent slot": "空天赋格",
        "Unknown": "未知",
        "Pet": "宠物",
        "Warrior": "战士",
        "Paladin": "圣骑士",
        "Hunter": "猎人",
        "Rogue": "潜行者",
        "Priest": "牧师",
        "Death Knight": "死亡骑士",
        "Shaman": "萨满祭司",
        "Mage": "法师",
        "Warlock": "术士",
        "Druid": "德鲁伊",
        "Balance": "平衡",
        "Feral Combat": "野性战斗",
        "Restoration": "恢复",
        "Holy": "神圣",
        "Protection": "防护",
        "Retribution": "惩戒",
        "Beast Mastery": "野兽控制",
        "Marksmanship": "射击",
        "Survival": "生存",
        "Assassination": "刺杀",
        "Combat": "战斗",
        "Subtlety": "敏锐",
        "Discipline": "戒律",
        "Shadow": "暗影",
        "Elemental": "元素",
        "Enhancement": "增强",
        "Arcane": "奥术",
        "Fire": "火焰",
        "Frost": "冰霜",
        "Affliction": "痛苦",
        "Demonology": "恶魔学识",
        "Destruction": "毁灭",
        "Arms": "武器",
        "Fury": "狂怒",
        "Blood": "鲜血",
        "Unholy": "邪恶",
        "Ferocity": "狂野",
        "Tenacity": "坚韧",
        "Cunning": "狡诈",
    }

    if translated, ok := translations[text]; ok {
        return translated
    }
    if strings.HasPrefix(text, "Rank ") {
        return "等级 " + strings.TrimPrefix(text, "Rank ")
    }
    if strings.HasPrefix(text, "Pre-requisite Talent ID ") {
        return "前置天赋 ID " + strings.TrimPrefix(text, "Pre-requisite Talent ID ")
    }
    if strings.HasPrefix(text, "Pre-requisite Rank ") {
        return "前置等级 " + strings.TrimPrefix(text, "Pre-requisite Rank ")
    }
    return text
}

'''
replace_once('func main() {\n    a := app.New()', localization + 'func main() {\n    currentLanguage = loadLanguage()\n    a := app.New()')

replace_once(
    '    window := a.NewWindow("WoW 3.3.5 Talent Editor - MySQL")',
    '    window := a.NewWindow(tr("WoW 3.3.5 Talent Editor - MySQL"))',
)
replace_once(
    '        dialog.ShowInformation("Info", fmt.Sprintf("Template config.json created at %s. Please edit it and restart.", cfgPath), window)',
    '        dialog.ShowInformation(tr("Info"), fmt.Sprintf(tr("Template config.json created at %s. Please edit it and restart."), cfgPath), window)',
)

menu_anchor = '    a.Settings().SetTheme(&customTheme{base: theme.DefaultTheme(), variant: theme.VariantDark})\n'
menu_code = r'''    a.Settings().SetTheme(&customTheme{base: theme.DefaultTheme(), variant: theme.VariantDark})

    restartWithLanguage := func(lang string) {
        if lang == currentLanguage {
            return
        }
        if err := saveLanguage(lang); err != nil {
            dialog.ShowError(fmt.Errorf("failed to save language: %w", err), window)
            return
        }
        exe, err := os.Executable()
        if err != nil {
            dialog.ShowError(fmt.Errorf("failed to locate executable: %w", err), window)
            return
        }
        cmd := exec.Command(exe, os.Args[1:]...)
        if err := cmd.Start(); err != nil {
            dialog.ShowError(fmt.Errorf("failed to restart application: %w", err), window)
            return
        }
        window.Close()
    }

    languageMenu := fyne.NewMenu(
        tr("Language"),
        fyne.NewMenuItem("简体中文", func() { restartWithLanguage("zh-CN") }),
        fyne.NewMenuItem("English", func() { restartWithLanguage("en") }),
    )
    window.SetMainMenu(fyne.NewMainMenu(languageMenu))
'''
replace_once(menu_anchor, menu_code)

# Static UI text.
replacements = {
    'widget.NewLabel("Select a TalentTab from the left")': 'widget.NewLabel(tr("Select a TalentTab from the left"))',
    'widget.NewLabel("Select a talent cell to edit")': 'widget.NewLabel(tr("Select a talent cell to edit"))',
    'formatLabel("Talent Tabs", 10)': 'formatLabel(tr("Talent Tabs"), 10)',
    'formatLabel("Editor Pane", 30)': 'formatLabel(tr("Editor Pane"), 30)',
    'formatLabel("Talent Grid", 30)': 'formatLabel(tr("Talent Grid"), 30)',
    'o.(*widget.Label).SetText(fmt.Sprintf("[%s] %s", item.Group, item.Tab.NameENUS))': 'o.(*widget.Label).SetText(fmt.Sprintf("[%s] %s", tr(item.Group), tr(item.Tab.NameENUS)))',
    'lbl := widget.NewLabel(label)': 'lbl := widget.NewLabel(tr(label))',
    'widget.NewButton("Save", func()': 'widget.NewButton(tr("Save"), func()',
    'widget.NewButton("Cancel", func()': 'widget.NewButton(tr("Cancel"), func()',
    'widget.NewButton("Delete", func()': 'widget.NewButton(tr("Delete"), func()',
    'tooltip = "Empty talent slot"': 'tooltip = tr("Empty talent slot")',
    'dialog.NewConfirm("Confirm Delete", "Are you sure you want to delete this talent?", func(yes bool)': 'dialog.NewConfirm(tr("Confirm Delete"), tr("Are you sure you want to delete this talent?"), func(yes bool)',
    'ctx.EditorContainer.Add(widget.NewLabel("Select a talent cell to edit"))': 'ctx.EditorContainer.Add(widget.NewLabel(tr("Select a talent cell to edit")))',
}
for old, new in replacements.items():
    if old not in s:
        raise RuntimeError(f"UI text anchor not found: {old}")
    s = s.replace(old, new)

src.write_text(s, encoding="utf-8")
print("TalentEditor Chinese/English UI patch applied successfully.")
