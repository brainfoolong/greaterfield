rem pack extension to zip for release management

cd %~dp0
set file=extension.zip
if exist %file% (
    del %file%
)

zip -r -S %file% . -x .git/* .gitignore .gitattributes .editorconfig .idea pack-extension.bat
