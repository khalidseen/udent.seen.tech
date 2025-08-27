اعمل ملف @echo off
echo ========================================
echo    udent.seen.tech Project Manager
echo ========================================
echo.

:: Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed on your system
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b 1
)

:: Navigate to project directory
cd /d "%~dp0"
echo Current Directory: %CD%
echo.

:: Check if this is a git repository
git status >nul 2>&1
if errorlevel 1 (
    echo This directory is not a git repository
    echo.
    :: Display options for non-git directory
    echo Choose an operation:
    echo 1. Clone project from GitHub
    echo 2. Open project in VS Code
    echo 3. Open project in Cursor
    echo 4. Show directory structure
    echo 0. Exit
    echo.
    set /p choice="Enter operation number: "
    
    if "%choice%"=="1" goto clone_project
    if "%choice%"=="2" goto open_code
    if "%choice%"=="3" goto open_cursor
    if "%choice%"=="4" goto show_structure
    if "%choice%"=="0" goto exit
    goto invalid_choice
) else (
    :: Check Git status
    echo Checking project status...
    git status
    echo.
    
    :: Display options for git repository
    echo Choose an operation:
    echo 1. Open project in VS Code
    echo 2. Open project in Cursor
    echo 3. Show current changes
    echo 4. Add all changes
    echo 5. Commit changes
    echo 6. Push changes to GitHub
    echo 7. Pull latest changes from GitHub
    echo 8. Create new branch
    echo 9. Show all branches
    echo 10. Install dependencies (npm install)
    echo 11. Run project in development mode (npm run dev)
    echo 12. Run project (npm start)
    echo 13. Build project (npm run build)
    echo 14. Show project information
    echo 15. Clone fresh copy from GitHub
    echo 0. Exit
    echo.
    
    set /p choice="Enter operation number: "
    
    if "%choice%"=="1" goto open_code
    if "%choice%"=="2" goto open_cursor
    if "%choice%"=="3" goto show_status
    if "%choice%"=="4" goto add_changes
    if "%choice%"=="5" goto commit_changes
    if "%choice%"=="6" goto push_changes
    if "%choice%"=="7" goto pull_changes
    if "%choice%"=="8" goto create_branch
    if "%choice%"=="9" goto show_branches
    if "%choice%"=="10" goto install_deps
    if "%choice%"=="11" goto run_dev
    if "%choice%"=="12" goto run_start
    if "%choice%"=="13" goto run_build
    if "%choice%"=="14" goto show_info
    if "%choice%"=="15" goto clone_fresh
    if "%choice%"=="0" goto exit
    goto invalid_choice
)

:clone_project
echo Cloning project from GitHub...
echo Repository URL: https://github.com/khalidseen/udent.seen.tech.git
echo.
set /p confirm="Do you want to clone the project? (y/n): "
if /i "%confirm%"=="y" (
    git clone https://github.com/khalidseen/udent.seen.tech.git
    echo Project cloned successfully!
    echo.
    echo Please navigate to the project folder and run this script again.
) else (
    echo Cloning cancelled.
)
pause
goto end

:clone_fresh
echo Creating fresh copy from GitHub...
echo This will create a new folder with the latest version.
echo.
set /p folder_name="Enter folder name (or press Enter for default): "
if "%folder_name%"=="" set folder_name=udent-fresh
echo.
echo Cloning to: %folder_name%
git clone https://github.com/khalidseen/udent.seen.tech.git %folder_name%
echo Fresh copy created successfully in: %folder_name%
pause
goto end

:open_code
echo Opening project in VS Code...
code .
goto end

:open_cursor
echo Opening project in Cursor...
cursor .
goto end

:show_status
echo Showing project status...
git status
pause
goto end

:add_changes
echo Adding all changes...
git add .
echo Changes added successfully!
pause
goto end

:commit_changes
set /p commit_msg="Enter commit message: "
echo Committing changes...
git commit -m "%commit_msg%"
echo Changes committed successfully!
pause
goto end

:push_changes
echo Pushing changes to GitHub...
git push origin main
echo Changes pushed successfully!
pause
goto end

:pull_changes
echo Pulling latest changes from GitHub...
git pull origin main
echo Changes pulled successfully!
pause
goto end

:create_branch
set /p branch_name="Enter new branch name: "
echo Creating new branch...
git checkout -b %branch_name%
echo Branch %branch_name% created successfully!
pause
goto end

:show_branches
echo Showing all branches...
git branch -a
pause
goto end

:install_deps
echo Installing dependencies...
if exist "package.json" (
    npm install
    echo Dependencies installed successfully!
) else (
    echo package.json file not found!
)
pause
goto end

:run_dev
echo Running project in development mode...
if exist "package.json" (
    npm run dev
) else (
    echo package.json file not found!
)
goto end

:run_start
echo Running project...
if exist "package.json" (
    npm start
) else (
    echo package.json file not found!
)
goto end

:run_build
echo Building project...
if exist "package.json" (
    npm run build
    echo Project built successfully!
) else (
    echo package.json file not found!
)
pause
goto end

:show_info
echo Project Information:
echo.
if exist "package.json" (
    echo package.json content:
    type package.json
) else (
    echo package.json file not found!
)
echo.
echo Directory structure:
dir
pause
goto end

:show_structure
echo Directory structure:
dir
pause
goto end

:invalid_choice
echo Invalid choice!
pause
goto end

:end
echo.
echo Operation completed
pause

:exit
echo Thank you for using the project manager!
pause