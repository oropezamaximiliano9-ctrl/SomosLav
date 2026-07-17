import re

with open('src/index.css', 'r') as f:
    content = f.read()

# I will find the point where `.form-bottom-sheet[data-open="true"] .form-content-inner` ends and remove everything after it.
cutoff_string = """
.form-bottom-sheet[data-open="true"] .form-content-inner {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 50ms;
}
"""

index = content.find(cutoff_string)
if index != -1:
    content = content[:index + len(cutoff_string)]

with open('src/index.css', 'w') as f:
    f.write(content.strip() + '\n')
