cask "checkmate-app" do
  version "2.1.0"
  sha256 :no_check

  url "https://github.com/adedayo/checkmate-app/releases/download/v#{version}/checkmate-app-macos-universal.dmg"
  name "CheckMate App"
  desc "Local SAST & Secret Exposure Intelligence Desktop Engine"
  homepage "https://github.com/adedayo/checkmate-app"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "checkmate-app.app"

  zap trash: [
    "~/.checkmate",
    "~/Library/Preferences/com.wails.checkmate-app.plist",
    "~/Library/Saved Application State/com.wails.checkmate-app.savedState",
  ]
end
