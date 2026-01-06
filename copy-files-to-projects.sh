#!/bin/bash
# Copy template files to all projects
# Run this script from the projects/ directory

for d in */; do
  # Skip template-project itself
  [ "$d" = "template-project/" ] && continue
  
  # Only process directories that are git repositories
  if [ -d "$d/.git" ]; then
    copied_anything=false
    project_name="${d%/}"
    
    # Copy .gitignore
    if [ -f "template-project/.gitignore" ]; then
      cp template-project/.gitignore "$d/.gitignore"
      echo "📦 $project_name: ✓ Updated .gitignore"
      copied_anything=true
    fi
    
    # Copy .cursor directory recursively (only if it doesn't exist)
    if [ -d "template-project/.cursor" ]; then
      if [ ! -d "$d/.cursor" ]; then
        cp -r template-project/.cursor "$d/"
        echo "📦 $project_name: ✓ Copied .cursor directory"
        copied_anything=true
      fi
    fi
    
    # Copy pre-commit.sh to project root
    if [ -f "template-project/pre-commit.sh" ]; then
      if [ ! -f "$d/pre-commit.sh" ] || ! cmp -s template-project/pre-commit.sh "$d/pre-commit.sh"; then
        cp template-project/pre-commit.sh "$d/pre-commit.sh"
        chmod +x "$d/pre-commit.sh"
        echo "📦 $project_name: ✓ Updated pre-commit.sh"
        copied_anything=true
      fi
      
      # Also copy to .git/hooks/pre-commit
      if [ -d "$d/.git/hooks" ]; then
        if [ ! -f "$d/.git/hooks/pre-commit" ] || ! cmp -s template-project/pre-commit.sh "$d/.git/hooks/pre-commit"; then
          cp template-project/pre-commit.sh "$d/.git/hooks/pre-commit"
          chmod +x "$d/.git/hooks/pre-commit"
          echo "📦 $project_name: ✓ Updated pre-commit hook"
          copied_anything=true
        fi
      fi
    fi
    
    # Copy tests/test_nothing.py (create tests directory if needed)
    if [ -f "template-project/tests/test_nothing.py" ]; then
      mkdir -p "$d/tests"
      if [ ! -f "$d/tests/test_nothing.py" ] || ! cmp -s template-project/tests/test_nothing.py "$d/tests/test_nothing.py"; then
        cp template-project/tests/test_nothing.py "$d/tests/test_nothing.py"
        echo "📦 $project_name: ✓ Updated tests/test_nothing.py"
        copied_anything=true
      fi
    fi
    
    # Print status for each project
    if [ "$copied_anything" = false ]; then
      echo "📦 $project_name: ✓ Already up to date"
    fi
  fi
done

echo "✅ Done copying template files to all projects!"
