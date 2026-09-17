#!/usr/bin/env ruby
require 'open-uri'
require 'json'

def fetch_pony
  url = 'https://derpibooru.org/api/v1/json/search/images?q=safe,pony&sf=random&per_page=1'
  headers = { "User-Agent" => "Mozilla/5.0", read_timeout: 10 }
  
  response = URI.open(url, headers).read
  data = JSON.parse(response)
  
  if data && data['images'] && !data['images'].empty?
    img_url = data['images'][0]['view_url']
    
    img_data = URI.open(img_url, headers).read
    
    File.open('./database/temp/pony.jpg', 'wb') do |file|
      file.write(img_data)
    end
    
    puts "SUCCESS"
  else
    puts "FAILED"
  end
rescue => e
  puts "ERROR: #{e.message}"
end

fetch_pony if __FILE__ == $0
