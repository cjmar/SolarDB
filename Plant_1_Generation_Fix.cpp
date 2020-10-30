#include <iostream>
#include <string>
#include <fstream>
#include <algorithm>

using std::cout;
using std::string;

/*
	This fix will only work on the Plant_1_Generation_Data.csv file

	Changes the date so DateTime can understand it
*/

int main()
{
	int numLines = 15;
	int i = 0;

	string input_file = "Plant_1_Generation_Data_1.csv";
	string output_file = "Plant_1_Generation_Data.csv";

	std::ifstream input(input_file);
	std::ofstream output(output_file);

	if (input.is_open())
	{
		string line;

		std::getline(input, line);
		output << line << "\n";

		while (std::getline(input, line) && i != numLines)
		{
			//string date = line.substr(0, line.find(" "));
			//cout << date << " || ";

			std::swap(line[0], line[3]);
			std::swap(line[1], line[4]);
			//fixed += date.substr(6, date.length());

			if(output.is_open())
				output << line << "\n";
			
		}

		output.close();
		input.close();

		cout << "Finished fixing files\nChecking for errors\n";

		//Compare the files sans the date
		std::ifstream input1(input_file);
		std::ifstream input2(input_file);

		string l1, l2;
		int errors = 0;

		while (std::getline(input1, l1) && std::getline(input2, l2))
		{
			if (l1.substr(5) != l2.substr(5))
			{
				cout << l1 << " | " << l2 << "\n";
				errors++;
			}
		}

		cout << errors << " errors found\n";

		input1.close();
		input2.close();

	}
	else
	{
		cout << "Unable to open: " << input_file << "\n";
	}

	return 0;
}