import re

with open('src/components/PatientsList.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove the tabs from the UI list
to_remove = ['EF / แบบฝึก', 'GNS', 'การนอน', 'การออกกำลังกาย', 'Before / After']

for tracker in to_remove:
    code = re.sub(r"\{\s*id:\s*'" + tracker + r"'[^}]+\},\n?\s*", "", code)

# Remove the blocks
blocks_to_remove = [
    r"\{\s*activeSubTab === 'EF / แบบฝึก' && \([\s\S]*?\}\s*\)\s*\}",
    r"\{\s*activeSubTab === 'GNS' && \([\s\S]*?\}\s*\)\s*\}",
    r"\{\s*activeSubTab === 'การนอน' && \([\s\S]*?\}\s*\)\s*\}",
    r"\{\s*activeSubTab === 'การออกกำลังกาย' && \([\s\S]*?\}\s*\)\s*\}",
    r"\{\s*activeSubTab === 'Before / After' && \([\s\S]*?\}\s*\)\s*\}"
]

for block_regex in blocks_to_remove:
    code = re.sub(block_regex, "", code)

with open('src/components/PatientsList.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PatientsList.tsx fixed.")
